import { CITATION_DOI_URL, CITATION_TEXT } from './citation'
import { addPngTextChunks } from './png'

/** Screenshots are rendered at this multiple of the on-screen resolution. */
export const SCREENSHOT_SCALE = 2

// Upper bounds for the enlarged render: the longest canvas side (WebGPU devices
// guarantee textures of 8192 px), and the pixels of the whole exported image.
const MAX_CANVAS_SIDE = 8192
const MAX_EXPORT_PIXELS = 8192 * 8192

/** The part of a NiiVue instance a screenshot needs. */
export interface ScreenshotPanel {
  canvas: HTMLCanvasElement | null
  // Besides forceDevicePixelRatio these are NiiVue view internals: render()
  // defers itself to a later frame while `isBusy`, and on WebGPU also until the
  // font renderer is ready; `device` / `gl` carry the GPU's size limits.
  view: {
    render(): void
    forceDevicePixelRatio?: number
    isBusy?: boolean
    fontRenderer?: { isReady?: boolean }
    device?: { limits?: { maxTextureDimension2D?: number } }
    gl?: WebGL2RenderingContext | null
  } | null
  opts?: { backend?: string }
  /** Setting it resizes the canvas backing store and renders again (<= 0: the display's ratio). */
  devicePixelRatio?: number
  /** Crosshair line width in canvas pixels. */
  crosshairWidth?: number
  drawScene(): void
}

interface ShownPanel {
  nv: ScreenshotPanel
  canvas: HTMLCanvasElement
  rect: DOMRect
}

export interface PlacedPanel extends ShownPanel {
  /** Position and backing-store size in the exported image. */
  x: number
  y: number
  width: number
  height: number
}

/** The panels whose canvas is on screen and has pixels to copy. */
function shownPanels(panels: ScreenshotPanel[]): ShownPanel[] {
  return panels.flatMap((nv) => {
    const canvas = nv.canvas
    const rect = canvas?.isConnected ? canvas.getBoundingClientRect() : null
    // drawImage throws for a canvas with an empty backing store.
    const hasPixels = !!canvas && canvas.width > 0 && canvas.height > 0
    return canvas && hasPixels && rect && rect.width > 0 && rect.height > 0
      ? [{ nv, canvas, rect }]
      : []
  })
}

/**
 * Where each panel on screen lands in an export at `scale` device pixels per
 * CSS pixel: its on-screen layout, sized the way NiiVue sizes a backing store
 * (the floor of CSS size times the ratio).
 */
export function placePanels(panels: ScreenshotPanel[], scale: number): PlacedPanel[] {
  const shown = shownPanels(panels)
  const left = Math.min(...shown.map(({ rect }) => rect.left))
  const top = Math.min(...shown.map(({ rect }) => rect.top))
  return shown.map((panel) => ({
    ...panel,
    x: Math.round((panel.rect.left - left) * scale),
    y: Math.round((panel.rect.top - top) * scale),
    width: Math.max(1, Math.floor(panel.rect.width * scale)),
    height: Math.max(1, Math.floor(panel.rect.height * scale)),
  }))
}

const isRenderable = ({ view, opts }: ScreenshotPanel) =>
  !view || (!view.isBusy && (opts?.backend === 'webgl2' || view.fontRenderer?.isReady !== false))

/**
 * Wait until no shown panel's view would defer its render (a GPU upload in
 * progress, or the WebGPU font atlas still loading); copying such a canvas
 * captures a blank tile.
 */
export async function waitUntilRenderable(
  panels: ScreenshotPanel[],
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!shownPanels(panels).every(({ nv }) => isRenderable(nv))) {
    if (Date.now() >= deadline) {
      throw new Error('The viewer is still busy; try the screenshot again')
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

/** Device pixels per CSS pixel a panel renders at on screen. */
function screenRatio({ view }: ScreenshotPanel): number {
  const forced = view?.forceDevicePixelRatio ?? -1
  return forced > 0 ? forced : window.devicePixelRatio || 1
}

/** The longest canvas side a panel's GPU can render. */
function maxCanvasSide({ view }: ScreenshotPanel): number {
  const gl = view?.gl
  const glLimit = gl
    ? Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), ...gl.getParameter(gl.MAX_VIEWPORT_DIMS))
    : Infinity
  const gpuLimit = view?.device?.limits?.maxTextureDimension2D ?? Infinity
  return Math.min(MAX_CANVAS_SIDE, glLimit, gpuLimit)
}

/**
 * Device pixels per CSS pixel for the export: SCREENSHOT_SCALE times the
 * sharpest on-screen ratio, reduced to stay within the GPU limits and the pixel
 * budget, but never below the least sharp on-screen ratio, at which every tile
 * is no larger than it already is on screen.
 */
function exportRatio(shown: ShownPanel[]): number {
  const onScreen = shown.map(({ nv }) => screenRatio(nv))
  const sideLimit = Math.min(
    ...shown.map(({ nv, rect }) => maxCanvasSide(nv) / Math.max(rect.width, rect.height)),
  )
  const width =
    Math.max(...shown.map(({ rect }) => rect.right)) -
    Math.min(...shown.map(({ rect }) => rect.left))
  const height =
    Math.max(...shown.map(({ rect }) => rect.bottom)) -
    Math.min(...shown.map(({ rect }) => rect.top))
  const budgetLimit = Math.sqrt(MAX_EXPORT_PIXELS / (width * height))
  return Math.max(
    Math.min(...onScreen),
    Math.min(Math.max(...onScreen) * SCREENSHOT_SCALE, sideLimit, budgetLimit),
  )
}

/** `tEXt` metadata written into every screenshot PNG. */
export const SCREENSHOT_METADATA: Record<string, string> = {
  Software: 'NiiVue Viewer (https://github.com/niivue/niivue-vscode)',
  Comment: `If you use this image in published work, please cite: ${CITATION_TEXT} ${CITATION_DOI_URL}`,
}

/** CSS color for a NiiVue RGBA color (channels 0-1); black when unusable. */
export function rgbaToCss(rgba: ArrayLike<number> | null | undefined): string {
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  if (!rgba || rgba.length < 3 || ![0, 1, 2].every((i) => Number.isFinite(rgba[i]))) {
    return 'rgb(0, 0, 0)'
  }
  const [r, g, b] = [0, 1, 2].map((i) => Math.round(clamp(rgba[i]) * 255))
  const alpha = Number.isFinite(rgba[3]) ? clamp(rgba[3]) : 1
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Captures run one after another: an overlapping capture would otherwise save
// the enlarged ratio of the one before it as the value to restore.
let lastCapture: Promise<unknown> = Promise.resolve()

/**
 * Capture the panels as laid out on screen, rendered at SCREENSHOT_SCALE times
 * the on-screen resolution, as PNG bytes carrying SCREENSHOT_METADATA. Resolves
 * to null when no panel has a canvas on screen.
 */
export function captureScreenshot(
  panels: ScreenshotPanel[],
  backgroundColor?: ArrayLike<number> | null,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const capture = lastCapture.then(() => captureNow(panels, backgroundColor))
  lastCapture = capture.catch(() => undefined)
  return capture
}

// Attempts at a pass in which every tile renders right away.
const CAPTURE_ATTEMPTS = 3

async function captureNow(
  panels: ScreenshotPanel[],
  backgroundColor?: ArrayLike<number> | null,
): Promise<Uint8Array<ArrayBuffer> | null> {
  for (let attempt = 0; attempt < CAPTURE_ATTEMPTS; attempt++) {
    await waitUntilRenderable(panels)
    const out = compositeAtExportResolution(panels, backgroundColor)
    if (out === 'busy') {
      continue
    }
    if (!out) {
      return null
    }
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
    if (!blob) {
      throw new Error('Could not encode the screenshot as PNG')
    }
    return addPngTextChunks(new Uint8Array(await blob.arrayBuffer()), SCREENSHOT_METADATA)
  }
  throw new Error('The viewer is still busy; try the screenshot again')
}

/**
 * Enlarge, render, copy and restore every tile in one synchronous pass, so the
 * tiles show the same moment and nothing can change a tile's settings while it
 * is enlarged. Returns 'busy' when a tile could not render right away.
 */
function compositeAtExportResolution(
  panels: ScreenshotPanel[],
  backgroundColor?: ArrayLike<number> | null,
): HTMLCanvasElement | null | 'busy' {
  const shown = shownPanels(panels)
  if (shown.length === 0) {
    return null
  }
  const ratio = exportRatio(shown)
  const placed = placePanels(panels, ratio)

  const out = document.createElement('canvas')
  out.width = Math.max(...placed.map(({ x, width }) => x + width))
  out.height = Math.max(...placed.map(({ y, height }) => y + height))
  const ctx = out.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create a 2D canvas for the screenshot')
  }
  ctx.fillStyle = rgbaToCss(backgroundColor)
  ctx.fillRect(0, 0, out.width, out.height)

  // One tile at a time, so only one canvas holds enlarged GPU buffers.
  for (const { nv, canvas, x, y } of placed) {
    const previousRatio = nv.view?.forceDevicePixelRatio ?? -1
    const enlargement = ratio / screenRatio(nv)
    const crosshairWidth = nv.crosshairWidth
    try {
      nv.devicePixelRatio = ratio
      // The crosshair width is in canvas pixels, so it needs the same scaling
      // to look as it does on screen.
      if (crosshairWidth) {
        nv.crosshairWidth = crosshairWidth * enlargement
      }
      if (!isRenderable(nv)) {
        return 'busy'
      }
      // Render in the same task that copies: the contexts have no
      // preserveDrawingBuffer, so a canvas drawn in an earlier frame reads back
      // blank.
      nv.drawScene()
      nv.view?.render()
      ctx.drawImage(canvas, x, y)
    } finally {
      // The crosshair setter draws the scene, which can throw; the canvas size
      // is restored regardless.
      try {
        if (crosshairWidth) {
          nv.crosshairWidth = crosshairWidth
        }
      } finally {
        nv.devicePixelRatio = previousRatio
      }
    }
  }
  return out
}
