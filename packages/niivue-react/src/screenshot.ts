import { CITATION_DOI_URL, CITATION_TEXT } from './citation'
import { addPngTextChunks } from './png'

/** The part of a niivue instance a screenshot needs. */
export interface ScreenshotPanel {
  canvas: HTMLCanvasElement | null
  view: { render(): void } | null
  drawScene(): void
}

/** `tEXt` metadata written into every screenshot PNG. */
export const SCREENSHOT_METADATA: Record<string, string> = {
  Software: 'niivue Viewer (https://github.com/niivue/niivue-vscode)',
  Comment: `If you use this image in published work, please cite: ${CITATION_TEXT} ${CITATION_DOI_URL}`,
}

/** CSS color for a niivue RGBA color (channels 0-1); black when unusable. */
export function rgbaToCss(rgba: ArrayLike<number> | null | undefined): string {
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  if (!rgba || rgba.length < 3 || ![0, 1, 2].every((i) => Number.isFinite(rgba[i]))) {
    return 'rgb(0, 0, 0)'
  }
  const [r, g, b] = [0, 1, 2].map((i) => Math.round(clamp(rgba[i]) * 255))
  const alpha = Number.isFinite(rgba[3]) ? clamp(rgba[3]) : 1
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Composite the panels' canvases into one canvas, laid out as they are on
 * screen at `window.devicePixelRatio`, over `backgroundColor`. Returns null
 * when no panel has a canvas on screen.
 */
export function compositePanels(
  panels: ScreenshotPanel[],
  backgroundColor?: ArrayLike<number> | null,
): HTMLCanvasElement | null {
  const shown = panels.flatMap((nv) => {
    const canvas = nv.canvas
    const rect = canvas?.isConnected ? canvas.getBoundingClientRect() : null
    return canvas && rect && rect.width > 0 && rect.height > 0 ? [{ nv, canvas, rect }] : []
  })
  if (shown.length === 0) {
    return null
  }
  const left = Math.min(...shown.map(({ rect }) => rect.left))
  const top = Math.min(...shown.map(({ rect }) => rect.top))
  const right = Math.max(...shown.map(({ rect }) => rect.right))
  const bottom = Math.max(...shown.map(({ rect }) => rect.bottom))
  const scale = window.devicePixelRatio || 1

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round((right - left) * scale))
  out.height = Math.max(1, Math.round((bottom - top) * scale))
  const ctx = out.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create a 2D canvas for the screenshot')
  }
  ctx.fillStyle = rgbaToCss(backgroundColor)
  ctx.fillRect(0, 0, out.width, out.height)

  for (const { nv, canvas, rect } of shown) {
    // Copy each canvas right after its own render, in the same task: the
    // contexts have no preserveDrawingBuffer, so a canvas read later is blank.
    nv.drawScene()
    nv.view?.render()
    ctx.drawImage(
      canvas,
      Math.round((rect.left - left) * scale),
      Math.round((rect.top - top) * scale),
      Math.round(rect.width * scale),
      Math.round(rect.height * scale),
    )
  }
  return out
}

/**
 * Capture the panels as they appear on screen as PNG bytes carrying
 * SCREENSHOT_METADATA. Resolves to null when no panel has a canvas on screen.
 */
export async function captureScreenshot(
  panels: ScreenshotPanel[],
  backgroundColor?: ArrayLike<number> | null,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const canvas = compositePanels(panels, backgroundColor)
  if (!canvas) {
    return null
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    throw new Error('Could not encode the screenshot as PNG')
  }
  return addPngTextChunks(new Uint8Array(await blob.arrayBuffer()), SCREENSHOT_METADATA)
}
