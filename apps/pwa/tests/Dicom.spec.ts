import { expect, test } from './fixtures'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { BASE_URL, waitForImageLoad } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// A successful load resolves `waitForImageLoad` (state wait on loadedCount), so
// the only thing left to verify is that no failure overlay surfaced. Assert that
// directly and deterministically instead of sleeping for an arbitrary "settle"
// window and grepping body text. `Volume.tsx` renders "Failed to load image" on
// error; its absence is the real signal.
async function expectNoLoadError(page) {
  await expect(page.getByText(/Failed to load image/i)).toHaveCount(0)
}

test.describe('Loading DICOM images', () => {
  test('loads DICOM file from local test assets', async ({ page }) => {
    await page.goto(BASE_URL)

    // Read DICOM file as ArrayBuffer
    const dicomPath = path.join(__dirname, '..', 'test', 'assets', 'enh.dcm')
    const dicomBuffer = fs.readFileSync(dicomPath)
    const dicomArrayBuffer = dicomBuffer.buffer.slice(
      dicomBuffer.byteOffset,
      dicomBuffer.byteOffset + dicomBuffer.byteLength
    )

    // Send message to app to load DICOM from ArrayBuffer
    const message = {
      type: 'addImage',
      body: {
        data: Array.from(new Uint8Array(dicomArrayBuffer)),
        uri: 'enh.dcm',
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message)

    // Wait for canvas to appear - this verifies NiiVue successfully loaded the DICOM
    await waitForImageLoad(page)

    // Verify canvas loaded
    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)

    // Verify no error overlay appeared
    await expectNoLoadError(page)
  })

  test('loads an extension-less DICOM file via magic-byte detection', async ({ page }) => {
    // Scanner exports often have no extension (IM_0001) or a bare UID as the
    // name. The viewer must detect DICOM content from the "DICM" magic bytes
    // and route the file through the DICOM loader.
    await page.goto(BASE_URL)

    const dicomPath = path.join(__dirname, '..', 'test', 'assets', 'enh.dcm')
    const dicomBuffer = fs.readFileSync(dicomPath)

    const message = {
      type: 'addImage',
      body: {
        data: Array.from(new Uint8Array(dicomBuffer)),
        uri: 'IM_0001',
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message)
    await waitForImageLoad(page)

    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)

    await expectNoLoadError(page)
  })

  test('loads a DICOM series passed as an array of files', async ({ page }) => {
    // Multi-file series arrive as `uri: string[]` + `data: ArrayBuffer[]`
    // (VS Code series expansion, PWA folder drop). This path previously threw
    // because loadVolume called string methods on the array uri. dcm2niix
    // assembles the array into one volume per series.
    await page.goto(BASE_URL)

    const dicomPath = path.join(__dirname, '..', 'test', 'assets', 'enh.dcm')
    const dicomBuffer = fs.readFileSync(dicomPath)

    const message = {
      type: 'addImage',
      body: {
        data: [Array.from(new Uint8Array(dicomBuffer))],
        uri: ['enh.dcm'],
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message)
    await waitForImageLoad(page)

    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)

    await expectNoLoadError(page)
  })

  test('loads DICOM from URL', async ({ page }) => {
    await page.goto(BASE_URL)

    const testLink = BASE_URL + 'enh.dcm' // Re-using enh.dcm as a "remote" url test

    const message = {
      type: 'addImage',
      body: {
        data: '',
        uri: testLink,
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message)
    await waitForImageLoad(page)

    // Verify canvas loaded
    const canvases = await page.$$('canvas')
    expect(canvases).toHaveLength(1)

    // Verify volume loaded without error
    await expectNoLoadError(page)
  })

  test('handles multiple DICOM files', async ({ page }) => {
    await page.goto(BASE_URL)

    const testLink = BASE_URL + 'enh.dcm'

    const message1 = {
      type: 'addImage',
      body: {
        data: '',
        uri: testLink,
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message1)
    await waitForImageLoad(page)

    // Load a second DICOM. NOTE: no `?v=2` query — a query string makes the URL
    // miss the `.dcm` routing in loadVolume and fall through to the mesh loader,
    // which fails. (The old test hid that by only sleeping then asserting ≥1
    // canvas, so the second load was never actually verified.) A second addImage
    // already spins up a fresh canvas, so the same URL is genuinely a second load.
    const message2 = {
      type: 'addImage',
      body: {
        data: '',
        uri: testLink,
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message2)

    // Wait for the second load to complete (loadedCount increments to 2) rather
    // than guessing with a fixed delay, then confirm both canvases are present.
    await waitForImageLoad(page)
    await expect(page.locator('canvas')).toHaveCount(2)
  })
})
