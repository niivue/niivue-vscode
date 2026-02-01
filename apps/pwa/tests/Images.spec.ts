import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage } from './utils'

test.describe('Loading images', () => {
  test('loads a test image', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestImage(page)

    // Wait for canvas to appear - this verifies NiiVue successfully loaded the DICOM
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Verify canvas loaded
    const canvases1 = await page.$$('canvas')
    expect(canvases1.length).toBeGreaterThanOrEqual(1)

    // Wait for NiiVue to fully process the DICOM
    await page.waitForTimeout(2000)

    // Verify no error messages appeared
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('error')
    expect(bodyText).not.toContain('failed')

    // Load second image
    await loadTestImage(page)
    await page.waitForTimeout(1000)

    const canvases2 = await page.$$('canvas')
    expect(canvases2.length).toBeGreaterThanOrEqual(2)
  })
})
