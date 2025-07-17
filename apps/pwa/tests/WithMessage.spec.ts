import { test, expect } from '@playwright/test'
import { BASE_URL, loadTestImage, listenForDebugMessage } from './utils'

test.describe('app', () => {
  test('that there are 0 canvases when no image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForDebugMessage(page)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getNCanvas' }
      window.postMessage(message, '*')
    })

    expect(await message).toBe(0)
  })

  test('that there is 1 canvas when 1 image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForDebugMessage(page)

    await loadTestImage(page)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getNCanvas' }
      window.postMessage(message, '*')
    })

    expect(await message).toBe(1)
  })

  test('that there are 2 canvases when 2 image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForDebugMessage(page)

    await loadTestImage(page)
    await loadTestImage(page)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getNCanvas' }
      window.postMessage(message, '*')
    })

    expect(await message).toBe(2)
  })

  test('that cal_min and cal_max are correct', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForDebugMessage(page)

    await loadTestImage(page)

    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getMinMaxOfFirstImage' }
      window.postMessage(message, '*')
    })

    expect(await message).toStrictEqual([40, 80])
  })
})
