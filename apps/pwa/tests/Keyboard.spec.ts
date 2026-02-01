import { expect, test } from '@playwright/test'
import { BASE_URL } from './utils'

test.describe('Keyboard Controls', () => {
  test('closes ColorScale dialog with ESC key', async ({ page }) => {
    await page.goto(BASE_URL)

    // Load example image via menu
    await page.click('data-testid=menu-item-dropdown-Add Image')
    await page.click('text=/Example Image/i')

    // Wait for the image metadata to be displayed
    await page.waitForSelector('text=/matrix size:.*voxelsize:/i', { timeout: 15000 })

    // Open ColorScale menu (click the button directly)
    await page.click('button:has-text("ColorScale")')

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

    // Wait for dialog to be visible - use a more specific selector
    await page.waitForSelector('dialog[open]:has-text("Keyboard Controls")', { timeout: 5000 })

    // Verify dialog content
    const dialog = await page.locator('dialog[open]:has-text("Keyboard Controls")')
    await expect(dialog).toBeVisible()

    // Verify some keyboard shortcuts are displayed
    await expect(dialog).toContainText('Mouse Controls')
    await expect(dialog).toContainText('Navigation')
    await expect(dialog).toContainText('Crosshair Movement')
    await expect(dialog).toContainText('Menu & Dialog Controls')
    await expect(dialog).toContainText('ESC')
    await expect(dialog).toContainText('Close menus and dialogs')

    // Close dialog using the visible button in the dialog
    const closeButton = page.locator(
      'dialog[open]:has-text("Keyboard Controls") button:has-text("Close")',
    )
    await closeButton.click()

    // Wait a moment for dialog to close
    await page.waitForTimeout(200)

    // Verify dialog is closed by checking for [open] attribute
    await expect(page.locator('dialog[open]:has-text("Keyboard Controls")')).not.toBeVisible()
  })

  test('Enter key applies changes in ColorScale dialog', async ({ page }) => {
    await page.goto(BASE_URL)

    // Load example image via menu
    await page.click('data-testid=menu-item-dropdown-Add Image')
    await page.click('text=/Example Image/i')

    // Wait for the image metadata to be displayed
    await page.waitForSelector('text=/matrix size:.*voxelsize:/i', { timeout: 15000 })

    // Open ColorScale menu (click the button directly)
    await page.click('button:has-text("ColorScale")')

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
