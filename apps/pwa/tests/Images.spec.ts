import { expect, test } from '@playwright/test'
import { BASE_URL, loadTestImage } from './utils'

test.describe('Loading images', () => {
  test('loads a test image', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestImage(page)

    expect(await page.$$('canvas')).toHaveLength(1)
    expect(
      await page.textContent('text=/matrix size: 207 x 256 x 215, voxelsize: 0.74 x 0.74 x 0.74/i'),
    ).toBeTruthy()

    await loadTestImage(page)
    expect(await page.$$('canvas')).toHaveLength(2)
  })
})
