import { expect, test } from './fixtures'
import { BASE_URL, waitForImageLoad } from './utils'

test.describe('Menu overflow', () => {
  test('wide viewport keeps top-level menus inline (no More button)', { tag: '@dom' }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE_URL)

    // `exact` so this doesn't also match the brand button ("niivue Viewer").
    await expect(page.getByRole('button', { name: 'View', exact: true })).toBeVisible()
    await expect(page.getByTestId('menu-overflow')).toHaveCount(0)
  })

  test('narrow viewport collapses overflowing menus into the More menu', { tag: '@dom' }, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(BASE_URL)

    // Items that no longer fit collapse behind a single overflow ("More") button.
    const more = page.getByTestId('menu-overflow')
    await expect(more).toBeVisible()

    // A collapsed dropdown shows as an inline-expandable group inside the popover.
    await more.click()
    const viewGroup = page.getByTestId('menu-overflow-group-View')
    await expect(viewGroup).toBeVisible()

    // Expanding it reveals the dropdown's entries in place (inline accordion).
    await viewGroup.click()
    await expect(page.getByText('Axial', { exact: false })).toBeVisible()
  })

  test('menus revealed by loading an image still collapse into More when narrow', async ({
    page,
  }) => {
    // Serve the bundled lesion volume in place of the remote example image.
    await page.route('https://niivue.github.io/niivue-demo-images/mni152.nii.gz', (route) =>
      route.fulfill({ path: 'public/lesion.nii.gz' }),
    )

    await page.setViewportSize({ width: 760, height: 800 })
    await page.goto(BASE_URL)

    // With no image only Add Image/View/Zoom show and all fit at 760px.
    await expect(page.getByTestId('menu-overflow')).toHaveCount(0)

    await page.click('data-testid=menu-item-dropdown-Add Image')
    await page.click('text=/Example Image/i')
    await waitForImageLoad(page, 30000)

    // Loading reveals ColorScale/Overlay/Header/Navigation. They no longer all
    // fit, so the bar shows the More button instead of wrapping to a 2nd line.
    await expect(page.getByTestId('menu-overflow')).toBeVisible()
  })
})
