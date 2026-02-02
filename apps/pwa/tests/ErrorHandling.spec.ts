import { expect, test } from '@playwright/test'
import { BASE_URL } from './utils'

test.describe('Error Handling', () => {
  test('shows error inside canvas when loading invalid file', async ({ page }) => {
    await page.goto(BASE_URL)

    // Attempt to load an invalid image
    const message = {
      type: 'addImage',
      body: {
        data: '',
        uri: 'https://invalid.example.com/nonexistent.nii.gz',
      },
    }
    await page.evaluate((m) => window.postMessage(m, '*'), message)

    // Verify error message appears
    await expect(page.locator('text=Failed to load image')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(1000)
    await expect(page.locator('div').filter({ hasText: /nonexistent|fetch/i }).first()).toBeVisible()

    // Close with X button
    await page.click('button:has-text("X")')
    await expect(page.locator('text=Failed to load image')).not.toBeVisible()
  })
})
