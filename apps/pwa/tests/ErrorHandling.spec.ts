import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test.describe('Error Handling', () => {
  test('shows error inside canvas when loading invalid file', async ({ page }) => {
    await page.goto(BASE_URL)

    // Attempt to load an invalid image (will be intercepted and return 404)
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
    // Check that error details are shown (either filename or error message)
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/Not Found|404|nonexistent/i)

    // Close with X button
    await page.click('button:has-text("X")')
    await expect(page.locator('text=Failed to load image')).not.toBeVisible()
  })
})
