import { expect, test } from '@playwright/test'
import { BASE_URL, load4DTestImage } from './utils'

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL)
  await load4DTestImage(page)
})

test.describe('4D Navigation', () => {
  test('should display total volume count if image is 4D', async ({ page }) => {
    const volumeIndicator = page.getByTestId('volume-0')
    await expect(volumeIndicator).toBeVisible()
    await expect(volumeIndicator).toHaveText('0')
  })

  test('should increment volume index when clicking +', async ({ page }) => {
    const volumeIndicator = page.getByTestId('volume-0')
    const nextButton = page.locator('button[aria-label="Next frame"]')

    await expect(volumeIndicator).toHaveText('0')
    await nextButton.click()
    await expect(volumeIndicator).toHaveText('1')
  })

  test('should decrement volume index when clicking -', async ({ page }) => {
    const volumeIndicator = page.getByTestId('volume-0')
    const nextButton = page.locator('button[aria-label="Next frame"]')
    const prevButton = page.locator('button[aria-label="Previous frame"]')

    await nextButton.click()
    await expect(volumeIndicator).toHaveText('1')
    await prevButton.click()
    await expect(volumeIndicator).toHaveText('0')
  })

  test('should enter edit mode when clicking volume number', async ({ page }) => {
    const volumeIndicator = page.getByTestId('volume-0')
    await volumeIndicator.click()

    const volumeInput = page.getByTestId('volume-input-0')
    await expect(volumeInput).toBeVisible()
    await expect(volumeInput).toHaveValue('0')
  })

  test('should change volume when entering a number and pressing Enter', async ({ page }) => {
    const volumeIndicator = page.getByTestId('volume-0')
    await volumeIndicator.click()

    const volumeInput = page.getByTestId('volume-input-0')
    await volumeInput.fill('5')
    await volumeInput.press('Enter')

    await expect(volumeIndicator).toBeVisible()
    await expect(volumeIndicator).toHaveText('5')
  })

  test('should toggle play/pause', async ({ page }) => {
    const playButton = page.getByTestId('volume-play-0')
    const volumeIndicator = page.getByTestId('volume-0')

    // Initial state
    await expect(playButton).toHaveAttribute('aria-label', 'Play')

    // Click play
    await playButton.click()
    await expect(playButton).toHaveAttribute('aria-label', 'Pause')

    // Wait for a few iterations (animation happens every 200ms)
    await page.waitForTimeout(1000)

    // Frame should have changed
    const currentFrame = await volumeIndicator.innerText()
    expect(parseInt(currentFrame)).toBeGreaterThan(0)

    // Click pause
    await playButton.click()
    await expect(playButton).toHaveAttribute('aria-label', 'Play')

    // Frame should stay the same
    const frameAfterPause = await volumeIndicator.innerText()
    await page.waitForTimeout(500)
    await expect(volumeIndicator).toHaveText(frameAfterPause)
  })
})
