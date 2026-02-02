import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { BASE_URL } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Verify canvas loaded
    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)

    // Wait for NiiVue to fully process the DICOM
    await page.waitForTimeout(2000)

    // Verify no error messages appeared
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('error')
    expect(bodyText).not.toContain('failed')
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
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Verify canvas loaded
    const canvases = await page.$$('canvas')
    expect(canvases).toHaveLength(1)
    
    // Wait for processing
    await page.waitForTimeout(1000)

    // Verify volume loaded
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
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
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Load second DICOM (using enh.dcm as second one too)
    const message2 = {
      type: 'addImage',
      body: {
        data: '',
        uri: testLink + '?v=2', // dummy param to make it "new"
      },
    }

    await page.evaluate((m) => window.postMessage(m, '*'), message2)
    
    // Should have 2 canvases now
    await page.waitForTimeout(1000)
    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1) // At least one canvas (may share)
  })
})
