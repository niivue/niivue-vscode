import { expect, test } from '@playwright/test'
import { BASE_URL, listenForDebugMessage, loadOverlay, loadTestImage } from './utils'

test.describe('Loading images', () => {
  test('loads a test image', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestImage(page)

    expect(await page.$$('canvas')).toHaveLength(1)
    expect(
      await page.textContent('text=/matrix size: .* voxelsize: .*/i'),
    ).toBeTruthy()

    await loadOverlay(page)
    await expect.poll(async () => {
      const messagePromise = listenForDebugMessage(page)
      await page.evaluate(() => {
        window.postMessage({ type: 'debugRequest', body: 'getNVolumes' }, '*')
      })
      return await messagePromise
    }, { timeout: 10000 }).toBe(2)
  })
})
