import { expect, test } from '@playwright/test'
import { BASE_URL } from './utils'

test('Browser can fetch external URL', async ({ page }) => {
  await page.goto(BASE_URL)

  const result = await page.evaluate(async () => {
    try {
      const response = await fetch('https://niivue.github.io/niivue-demo-images/mni152.nii.gz', {
        mode: 'cors',
      })
      return {
        ok: response.ok,
        status: response.status,
        type: response.type,
        headers: {
          'content-type': response.headers.get('content-type'),
        },
      }
    } catch (error: any) {
      return { error: error.message, name: error.name, stack: error.stack }
    }
  })

  console.log('Fetch result:', JSON.stringify(result, null, 2))
  expect(result).toHaveProperty('ok')
})
