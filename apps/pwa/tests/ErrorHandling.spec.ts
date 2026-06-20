import { expect, test } from './fixtures'
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
    // The detail line auto-retries via toBeVisible; no fixed settle needed.
    await expect(page.locator('div').filter({ hasText: /nonexistent|fetch/i }).first()).toBeVisible()

    // Close with the close button
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('text=Failed to load image')).not.toBeVisible()
  })

  test('warns that an oversized NIfTI is too large instead of trying to load it', async ({
    page,
  }) => {
    await page.goto(BASE_URL)

    // A minimal NIfTI-1 header declaring a 1400 x 1400 x 1000 int16 volume
    // (~3.65 GB of voxels) with no body. The size guard reads only the header
    // and refuses it before any allocation - see niivue/niivue-vscode#228.
    await page.evaluate(() => {
      const header = new Uint8Array(352)
      const dv = new DataView(header.buffer)
      dv.setInt32(0, 348, true) // sizeof_hdr -> NIfTI-1
      dv.setInt16(40, 3, true) // dim[0] = 3 dimensions
      dv.setInt16(42, 1400, true) // dim[1]
      dv.setInt16(44, 1400, true) // dim[2]
      dv.setInt16(46, 1000, true) // dim[3]
      dv.setInt16(72, 16, true) // bitpix = 16
      window.postMessage({ type: 'addImage', body: { data: header.buffer, uri: 'huge.nii' } }, '*')
    })

    await expect(page.locator('text=Image too large to display')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/too large to display/i).first()).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('text=Image too large to display')).not.toBeVisible()
  })
})
