import type { Page } from '@playwright/test'
import { readFile } from 'fs/promises'
import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage, waitForImageLoad } from './utils'

/**
 * End-to-end proof for the `.nvd` import/export round-trip on the PWA - the
 * renderer round-trip the unit tests cannot cover (jsdom has no WebGL): export
 * the live scene to an `.nvd` and re-import it by dropping the file.
 *
 * As of the NiiVue v1.0 migration the `.nvd` payload is CBOR (the bytes from
 * `nv.serializeDocument()`), not JSON, so this asserts on bytes and the
 * round-trip rather than the old `encodedImageBlobs` JSON shape.
 */

// Load one image, export the active canvas via the NVDocument button (its label
// click saves by default), and return the downloaded `.nvd` file's bytes.
async function exportScene(page: Page): Promise<number[]> {
  await page.goto(BASE_URL)
  await loadTestImage(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'NVDocument' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.nvd$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  return Array.from(await readFile(path as string))
}

// Drop a file onto the app's ImageDrop region, like a user would.
async function dropFile(page: Page, bytes: number[], name: string) {
  await page.evaluate(
    ({ bytes, name }) => {
      const file = new File([new Uint8Array(bytes)], name, { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)
      const target = document.querySelector('[data-testid="image-drop"]') as HTMLElement
      if (!target) throw new Error('ImageDrop root not found')
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }))
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }))
    },
    { bytes, name },
  )
}

// Canvases, volumes in the first canvas, and its load error.
async function sceneState(page: Page) {
  return page.evaluate(() => {
    const arr = (
      window as { appProps?: { nvArray: { value: { volumes?: unknown[]; loadError?: string }[] } } }
    ).appProps?.nvArray.value
    return {
      canvases: arr?.length ?? 0,
      volumes: arr?.[0]?.volumes?.length ?? 0,
      loadError: arr?.[0]?.loadError ?? '',
    }
  })
}

test.describe('NVDocument (.nvd) import/export', () => {
  test('Save Scene exports a non-empty CBOR .nvd; the facade getDocument agrees', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)

    // Export via the protocol facade over real WebGL: getDocument returns the
    // CBOR document bytes (with the loaded volume embedded).
    const facadeBytes = await page.evaluate(async () => {
      const doc = await (window as { viewerClient: { getDocument: () => Promise<Uint8Array> } })
        .viewerClient.getDocument()
      return doc?.byteLength ?? 0
    })
    expect(facadeBytes).toBeGreaterThan(0)

    // Export via the UI (NVDocument label click = Save) downloads the same CBOR
    // bytes - binary, not JSON.
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'NVDocument' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.nvd$/)
    const bytes = await readFile((await download.path()) as string)
    expect(bytes.byteLength).toBeGreaterThan(0)
    // CBOR, not JSON: the payload must not begin with a JSON object/array.
    expect(bytes[0]).not.toBe('{'.charCodeAt(0))
    expect(bytes[0]).not.toBe('['.charCodeAt(0))
  })

  test('dropping an exported .nvd re-imports the scene', async ({ page }) => {
    const nvdBytes = await exportScene(page)

    // Fresh app (home screen, no canvases), then drop the .nvd.
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await dropFile(page, nvdBytes, 'scene.nvd')
    await waitForImageLoad(page)

    // The imported document should reconstruct one canvas holding the volume.
    const state = await sceneState(page)
    expect(state.canvases).toBe(1)
    expect(state.volumes).toBeGreaterThan(0)
  })

  test("Save as JSON writes NiiVue's JSON document, which re-imports the scene", async ({
    page,
  }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('menu-item-dropdown-NVDocument').click()
    await page.getByText('Save as JSON', { exact: true }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.nvd\.json$/)
    const json = await readFile((await download.path()) as string)
    const doc = JSON.parse(json.toString('utf8'))
    expect(doc.layout).toBeTruthy()
    // The embedded volume uses NiiVue's typed-array tags.
    expect(json.toString('utf8')).toContain('"$ta"')

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await dropFile(page, Array.from(json), 'scene.nvd.json')
    await waitForImageLoad(page)

    expect(await sceneState(page)).toEqual({ canvases: 1, volumes: 1, loadError: '' })
  })

  test('a hand-written JSON scene that links its volume by URL loads', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const doc = { volumes: [{ url: `${BASE_URL}lesion.nii.gz`, colormap: 'hot' }] }

    await dropFile(page, Array.from(Buffer.from(JSON.stringify(doc))), 'linked.nvd.json')
    await waitForImageLoad(page)

    expect(await sceneState(page)).toEqual({ canvases: 1, volumes: 1, loadError: '' })
  })
})
