import type { Page } from '@playwright/test'
import { readFile } from 'fs/promises'
import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage, waitForImageLoad } from './utils'

/**
 * The Screenshot button over a real renderer. Unlike most specs this reads
 * pixels: a capture that copies a canvas without rendering it in the same task
 * produces a PNG of the right size that is blank, and only a real WebGL/WebGPU
 * context shows that. Layout math and the PNG writer are unit-tested in
 * packages/niivue-react (screenshot.test.ts, png.test.ts).
 */

type Chunk = { type: string; data: Buffer }

async function loadImage(page: Page, file: string) {
  const message = { type: 'addImage', body: { data: '', uri: BASE_URL + file } }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await waitForImageLoad(page)
}

function pngChunks(png: Buffer): Chunk[] {
  const chunks: Chunk[] = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    chunks.push({
      type: png.toString('latin1', offset + 4, offset + 8),
      data: png.subarray(offset + 8, offset + 8 + length),
    })
    offset += 12 + length
  }
  return chunks
}

// Screenshots render at twice the on-screen resolution (SCREENSHOT_SCALE).
const EXPORT_SCALE = 2

// The tiles as exported: on-screen layout at twice the device pixel ratio, each
// canvas at NiiVue's backing-store size (floor of CSS size times the ratio).
async function tileLayout(page: Page) {
  return page.evaluate((exportScale) => {
    const scale = (window.devicePixelRatio || 1) * exportScale
    const rects = Array.from(document.querySelectorAll('canvas'), (c) => c.getBoundingClientRect())
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    const tiles = rects.map((r) => ({
      x: Math.round((r.left - left) * scale),
      y: Math.round((r.top - top) * scale),
      w: Math.floor(r.width * scale),
      h: Math.floor(r.height * scale),
    }))
    return {
      width: Math.max(...tiles.map((t) => t.x + t.w)),
      height: Math.max(...tiles.map((t) => t.y + t.h)),
      tiles,
    }
  }, EXPORT_SCALE)
}

// Whether every canvas is back at its on-screen resolution.
const canvasesAtScreenResolution = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('canvas')).every((c) => {
      const r = c.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      return c.width === Math.floor(r.width * ratio) && c.height === Math.floor(r.height * ratio)
    }),
  )

test.describe('Screenshot', () => {
  test('saves the tiles as a PNG of the rendered image with the citation', async ({ page }) => {
    await page.goto(BASE_URL)
    // Two different images, so a compositor that copies the wrong canvas into
    // a tile shows up as identical tiles.
    await loadTestImage(page)
    await loadImage(page, 'pcasl.nii.gz')
    await expect(page.locator('canvas')).toHaveCount(2)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Screenshot', exact: true }).click()
    const download = await downloadPromise
    expect(['lesion_screenshot.png', 'pcasl_screenshot.png']).toContain(
      download.suggestedFilename(),
    )
    const png = await readFile((await download.path()) as string)
    expect(await canvasesAtScreenResolution(page)).toBe(true)

    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const chunks = pngChunks(png)
    const layout = await tileLayout(page)
    expect(chunks[0].type).toBe('IHDR')
    expect([chunks[0].data.readUInt32BE(0), chunks[0].data.readUInt32BE(4)]).toEqual([
      layout.width,
      layout.height,
    ])
    const comment = chunks
      .filter((c) => c.type === 'tEXt')
      .map((c) => c.data.toString('latin1'))
      .find((text) => text.startsWith('Comment\0'))
    expect(comment).toContain('https://doi.org/10.52294/001c.167815')

    // Decode in the browser: each tile must hold rendered content, and the gap
    // between the side-by-side tiles must be the viewer background (black).
    const pixels = await page.evaluate(
      async ({ base64, tiles }) => {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
        const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)
        const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
        const brightness = (x: number, y: number) => {
          const i = (y * width + x) * 4
          return Math.max(data[i], data[i + 1], data[i + 2])
        }
        const litFraction = tiles.map(({ x, y, w, h }) => {
          let lit = 0
          for (let row = y; row < y + h; row++) {
            for (let col = x; col < x + w; col++) {
              if (brightness(col, row) > 32) lit++
            }
          }
          return lit / (w * h)
        })
        let gapMax = 0
        for (let row = 0; row < height; row++) {
          for (let col = tiles[0].x + tiles[0].w; col < tiles[1].x; col++) {
            gapMax = Math.max(gapMax, brightness(col, row))
          }
        }
        // Mean absolute difference between the two tiles, sampled on a grid.
        let diff = 0
        let samples = 0
        const w = Math.min(tiles[0].w, tiles[1].w)
        const h = Math.min(tiles[0].h, tiles[1].h)
        for (let row = 0; row < h; row += 4) {
          for (let col = 0; col < w; col += 4) {
            diff += Math.abs(
              brightness(tiles[0].x + col, tiles[0].y + row) -
                brightness(tiles[1].x + col, tiles[1].y + row),
            )
            samples++
          }
        }
        return {
          litFraction,
          gapWidth: tiles[1].x - tiles[0].x - tiles[0].w,
          gapMax,
          tileDifference: diff / samples,
        }
      },
      { base64: png.toString('base64'), tiles: layout.tiles },
    )
    for (const fraction of pixels.litFraction) {
      expect(fraction).toBeGreaterThan(0.01)
    }
    expect(pixels.gapWidth).toBeGreaterThan(0)
    expect(pixels.gapMax).toBe(0)
    expect(pixels.tileDifference).toBeGreaterThan(8)
  })
})
