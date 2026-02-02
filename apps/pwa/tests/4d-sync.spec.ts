import { expect, test } from '@playwright/test';
import { BASE_URL, load4DTestImage } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL)
  // Load two 4D images to test sync
  await load4DTestImage(page)
  await load4DTestImage(page)
})

test.describe('4D Sync', () => {
  test('should synchronize frame between two volumes when sync is enabled on both', async ({ page }) => {
    const vol0Indicator = page.getByTestId('volume-0')
    const vol1Indicator = page.getByTestId('volume-1')
    const sync0Button = page.getByTestId('volume-sync-0')
    const sync1Button = page.getByTestId('volume-sync-1')
    const next0Button = page.locator('button[aria-label="Next frame"]').first()

    // Ensure both volumes are loaded
    await expect(vol0Indicator).toBeVisible()
    await expect(vol1Indicator).toBeVisible()
    await expect(vol0Indicator).toHaveText('0')
    await expect(vol1Indicator).toHaveText('0')

    // Enable sync on both
    await sync0Button.click()
    await sync1Button.click()

    // Increment frame on the first volume
    await next0Button.click()

    // Both should now be at frame 1
    await expect(vol0Indicator).toHaveText('1')
    await expect(vol1Indicator).toHaveText('1')
  })

  test('should not synchronize frame if sync is only enabled on one volume', async ({ page }) => {
    const vol0Indicator = page.getByTestId('volume-0')
    const vol1Indicator = page.getByTestId('volume-1')
    const sync0Button = page.getByTestId('volume-sync-0')
    const next0Button = page.locator('button[aria-label="Next frame"]').first()

    // Enable sync only on the first volume
    await sync0Button.click()

    // Increment frame on the first volume
    await next0Button.click()

    // First should be at frame 1, second should remain at 0
    await expect(vol0Indicator).toHaveText('1')
    await expect(vol1Indicator).toHaveText('0')
  })

  test('should synchronize frame when using keyboard arrows if sync is enabled', async ({ page }) => {
    const vol0Indicator = page.getByTestId('volume-0')
    const vol1Indicator = page.getByTestId('volume-1')
    const sync0Button = page.getByTestId('volume-sync-0')
    const sync1Button = page.getByTestId('volume-sync-1')
    const canvas0 = page.locator('canvas').first()

    // Enable sync on both
    await sync0Button.click()
    await sync1Button.click()

    // Click canvas to ensure it has focus
    await canvas0.click()

    // Press Right arrow to increment frame
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100) // Wait for sync to propagate

    // Both should now be at frame 1
    await expect(vol0Indicator).toHaveText('1')
    await expect(vol1Indicator).toHaveText('1')

    // Press Left arrow to decrement frame
    await canvas0.click() // Ensure focus is regained
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100) // Wait for sync to propagate

    // Both should now be back at frame 0
    await expect(vol0Indicator).toHaveText('0')
    await expect(vol1Indicator).toHaveText('0')
  })
  test('should show sync button only when multiple 4D volumes are present', async ({ page }) => {
    const sync0Button = page.getByTestId('volume-sync-0')
    const remove1Button = page.locator('button[className*="text-xl"]').nth(1) // Assuming remove button is the 'X'

    // Initially 2 volumes (from beforeEach), sync button should be visible
    await expect(sync0Button).toBeVisible()

    // Remove the second volume
    // We need a more reliable way to remove volume or just load 1 in a separate test context.
    // However, since beforeEach loads 2, let's remove one using the UI or just execute script.
    // Click the X button to remove the second volume
    // The X button is part of the UI, let's target it specifically.
    const closeButton1 = page.locator('button', { hasText: 'X' }).nth(1)

    // Ensure visibility before clicking
    await expect(closeButton1).toBeVisible()
    await closeButton1.click()

    // Now only 1 volume, sync button on vol 0 should be hidden
    await expect(sync0Button).toBeHidden()
  })
})
