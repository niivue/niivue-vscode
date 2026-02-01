import { expect, test } from '@playwright/test'
import { BASE_URL, loadTestImage } from './utils'

test.describe('Loading images', () => {
  test('loads a test image', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestImage(page)

    // Verify canvas loaded
    const canvases1 = await page.$$('canvas')
    expect(canvases1.length).toBeGreaterThanOrEqual(1)

    // Wait for NiiVue to process
    await page.waitForTimeout(2000)

    // Verify no error messages
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Failed to load')
    expect(bodyText).not.toContain('error')

    // Load second image
    await loadTestImage(page)
    await page.waitForTimeout(1000)

    const canvases2 = await page.$$('canvas')
    expect(canvases2.length).toBeGreaterThanOrEqual(2)
  })
})
