import { test, expect } from '@playwright/test'
import { waitForDebugger } from 'inspector'

const BASE_URL = 'http://localhost:4000/'

test.describe('app', () => {
  test('that there are 0 canvases when no image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForMessage(page)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getNCanvas' }
      window.postMessage(message, '*')
    })

    expect(await message).toBe(0)
  })

  test('that there is 1 canvas when 1 image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForMessage(page)

    await loadTestImage(page)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getNCanvas' }
      window.postMessage(message, '*')
    })

    expect(await message).toBe(1)
  })

  test('that there are 2 canvases when 2 image is loaded', async ({ page }) => {
    await page.goto(BASE_URL)

    const message = listenForMessage(page)

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

    const message = listenForMessage(page)

    await loadTestImage(page)

    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      const message = { type: 'debugRequest', body: 'getMinMaxOfFirstImage' }
      window.postMessage(message, '*')
    })

    expect(await message).toStrictEqual([40, 80])
  })
})

async function loadTestImage(page) {
  const testLink = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
}

function listenForMessage(page) {
  const message = page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        console.log(event)
        console.log(event.data)
        if (event.data?.type == 'debugAnswer') resolve(event.data.body)
      })
    })
  })
  return message
}
