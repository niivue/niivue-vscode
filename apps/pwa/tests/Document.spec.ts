import type { Page } from '@playwright/test'
import { readFile } from 'fs/promises'
import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage, waitForImageLoad } from './utils'

/**
 * End-to-end proof for the Viewer-Host Protocol Phase 1a feature: `.nvd`
 * import/export on the PWA. This is the renderer round-trip that the unit tests
 * cannot cover (jsdom has no WebGL): export the live scene to an `.nvd` and
 * re-import it by dropping the file.
 */

// Load one image, export the active canvas via the Save Scene button, and
// return the downloaded `.nvd` file's text (downloadNvd writes uncompressed JSON).
async function exportScene(page: Page): Promise<string> {
  await page.goto(BASE_URL)
  await loadTestImage(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save Scene' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.nvd$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  return readFile(path as string, 'utf-8')
}

test.describe('NVDocument (.nvd) import/export', () => {
  test('Save Scene exports an embedded .nvd; the facade getDocument agrees', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)

    // Export via the protocol facade over real WebGL: getDocument embeds the
    // loaded volume and carries view options.
    const viaFacade = await page.evaluate(async () => {
      const doc = await (window as { viewerClient: { getDocument: () => Promise<any> } })
        .viewerClient.getDocument()
      return {
        blobs: Array.isArray(doc.encodedImageBlobs) ? doc.encodedImageBlobs.length : 0,
        hasOpts: !!doc.opts,
      }
    })
    expect(viaFacade.blobs).toBeGreaterThan(0)
    expect(viaFacade.hasOpts).toBeTruthy()

    // Export via the UI (Save Scene) downloads the same embedded shape.
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Save Scene' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.nvd$/)
    const doc = JSON.parse(await readFile((await download.path()) as string, 'utf-8'))
    expect(Array.isArray(doc.encodedImageBlobs)).toBeTruthy()
    expect(doc.encodedImageBlobs.length).toBeGreaterThan(0)
  })

  test('dropping an exported .nvd re-imports the scene', async ({ page }) => {
    const nvdText = await exportScene(page)

    // Fresh app (home screen, no canvases), then drop the .nvd onto the
    // ImageDrop region exactly like a user would.
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.evaluate((text) => {
      const file = new File([text], 'scene.nvd', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      const target = document.querySelector('[data-testid="image-drop"]') as HTMLElement
      if (!target) throw new Error('ImageDrop root not found')
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }))
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }))
    }, nvdText)

    await waitForImageLoad(page)

    // The imported document should reconstruct one canvas holding the volume.
    const state = await page.evaluate(() => {
      const arr = (window as { appProps?: { nvArray: { value: { volumes?: unknown[] }[] } } })
        .appProps?.nvArray.value
      return { canvases: arr?.length ?? 0, volumes: arr?.[0]?.volumes?.length ?? 0 }
    })
    expect(state.canvases).toBe(1)
    expect(state.volumes).toBeGreaterThan(0)
  })
})
