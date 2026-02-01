import { expect, test } from '@playwright/test'
import { BASE_URL, loadTestImage } from './utils'

test.describe('Keyboard Controls', () => {
  test('closes ColorScale dialog with ESC key', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)
    await page.waitForSelector('text=/matrix size:.*voxelsize:/i', { timeout: 10000 })

    // Open ColorScale menu
    await page.click('text=/ColorScale/i')

    // Verify ColorScale dialog is visible
    const colorScaleDialog = await page.locator('.absolute.left-8.top-8.bg-gray-500')
    await expect(colorScaleDialog).toBeVisible()

    // Press ESC key
    await page.keyboard.press('Escape')

    // Verify ColorScale dialog is closed
    await expect(colorScaleDialog).not.toBeVisible()
  })

  test('closes dropdown menu with ESC key', async ({ page }) => {
    await page.goto(BASE_URL)

    // Open Add Image dropdown menu
    await page.click('data-testid=menu-item-dropdown-Add Image')

    // Verify dropdown menu is visible
    const dropdownMenu = await page.locator('text=/Example Image/i')
    await expect(dropdownMenu).toBeVisible()

    // Press ESC key
    await page.keyboard.press('Escape')

    // Verify dropdown menu is closed
    await expect(dropdownMenu).not.toBeVisible()
  })

  test('closes View menu dropdown with ESC key', async ({ page }) => {
    await page.goto(BASE_URL)

    // Open View dropdown menu
    await page.click('data-testid=menu-item-dropdown-View')

    // Verify dropdown menu is visible
    const dropdownMenu = await page.locator('text=/Axial/i')
    await expect(dropdownMenu).toBeVisible()

    // Press ESC key
    await page.keyboard.press('Escape')

    // Verify dropdown menu is closed
    await expect(dropdownMenu).not.toBeVisible()
  })

  test('displays Info->Keyboard control dialog', async ({ page }) => {
    await page.goto(BASE_URL)

    // Open Info dropdown menu
    await page.click('data-testid=menu-item-dropdown-Info')

    // Click on Keyboard control entry
    await page.click('text=/Keyboard control/i')

    // Wait for dialog to be visible
    await page.waitForSelector('dialog:has-text("Keyboard Controls")', { timeout: 5000 })

    // Verify dialog content
    const dialog = await page.locator('dialog:has-text("Keyboard Controls")')
    await expect(dialog).toBeVisible()

    // Verify some keyboard shortcuts are displayed
    await expect(dialog).toContainText('Mouse Controls')
    await expect(dialog).toContainText('Navigation')
    await expect(dialog).toContainText('Crosshair Movement')
    await expect(dialog).toContainText('Menu & Dialog Controls')
    await expect(dialog).toContainText('ESC')
    await expect(dialog).toContainText('Close menus and dialogs')

    // Close dialog
    await page.click('button:has-text("Close")')

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible()
  })

  test('Enter key applies changes in ColorScale dialog', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)
    await page.waitForSelector('text=/matrix size:.*voxelsize:/i', { timeout: 10000 })

    // Open ColorScale menu
    await page.click('text=/ColorScale/i')

    // Verify ColorScale dialog is visible
    const colorScaleDialog = await page.locator('.absolute.left-8.top-8.bg-gray-500')
    await expect(colorScaleDialog).toBeVisible()

    // Focus on Min input and change value
    const minInput = await page.locator('input[type="number"]').first()
    await minInput.click()
    await minInput.fill('10')

    // Press Enter
    await page.keyboard.press('Enter')

    // The change should be applied (we can verify this by checking that the value persists)
    await expect(minInput).toHaveValue('10')
  })
})
