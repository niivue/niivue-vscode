import { expect, test } from '@playwright/test'
import { BASE_URL, loadTestImage, waitForImageLoad } from './utils'

test.describe('Menu', () => {
  test('displays home screen', async ({ page }) => {
    await page.goto(BASE_URL)

    expect(await page.textContent('text=/Home/i')).toBeTruthy()
    expect(await page.textContent('text=/Add Image/i')).toBeTruthy()
    expect(await page.textContent('text=/View/i')).toBeTruthy()
    expect(await page.textContent('text=/Bookmarklet/i')).toBeTruthy()
    expect(await page.textContent('text=/Drop Files to load images/i')).toBeTruthy()
  })

  test('menubar updates with loading images', async ({ page }) => {
    await page.goto(BASE_URL)

    // initially only these menu items are visible
    expect(await page.textContent('text=/Home/i')).toBeTruthy()
    expect(await page.textContent('text=/Add Image/i')).toBeTruthy()
    expect(await page.textContent('text=/View/i')).toBeTruthy()

    // initially these menu items do not exist
    expect(await page.$('text=/ColorScale/i')).toBeNull()
    expect(await page.$('text=/Overlay/i')).toBeNull()
    expect(await page.$('text=/Header/i')).toBeNull()
    expect(await page.$('text=/Select/i')).toBeNull()

    // load an image
    await loadTestImage(page)
    expect(
      await page.textContent('text=/matrix size:.*voxelsize:/i'),
    ).toBeTruthy()

    // after loading an image these are visible
    expect(await page.textContent('text=/Home/i')).toBeTruthy()
    expect(await page.textContent('text=/Add Image/i')).toBeTruthy()
    expect(await page.textContent('text=/View/i')).toBeTruthy()
    expect(await page.textContent('text=/ColorScale/i')).toBeTruthy()
    expect(await page.textContent('text=/Overlay/i')).toBeTruthy()
    expect(await page.textContent('text=/Header/i')).toBeTruthy()

    // the select menu item is only visible after loading 2 images
    expect(await page.$('text=/Select/i')).toBeNull()
    await loadTestImage(page)
    expect(await page.textContent('text=/Select/i')).toBeTruthy()
  })

  test('loads an image and checks the menu bar', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestImage(page)

    expect(await page.$$('canvas')).toHaveLength(1)
    expect(
      await page.textContent('text=/matrix size:.*voxelsize:/i'),
    ).toBeTruthy()

    const menuBar = ['Home', 'Add Image', 'View', 'ColorScale', 'Overlay', 'Header']
    for (const item of menuBar) {
      expect(await page.textContent(`text=/${item}/i`)).toBeTruthy()
    }
  })

  test('opens the example image via the menu bar', async ({ page }) => {
    // Intercept the remote example image and serve it from local assets to avoid timeouts in CI
    await page.route('https://niivue.github.io/niivue-demo-images/mni152.nii.gz', async (route) => {
      await route.fulfill({ path: 'public/lesion.nii.gz' })
    })

    await page.goto(BASE_URL)

    await page.click('data-testid=menu-item-dropdown-Add Image')
    await page.click('text=/Example Image/i')

    await waitForImageLoad(page, 30000)
    expect(await page.$$('canvas')).toHaveLength(1)
    expect(
      await page.textContent('text=/matrix size:.*voxelsize:/i'),
    ).toBeTruthy()
  })
})
