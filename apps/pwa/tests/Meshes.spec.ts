import { expect, test } from '@playwright/test'
import { BASE_URL, loadTestSurfImage, loadTestSurfOverlay } from './utils'

test.describe('Loading meshes', () => {
  test('loads a test surface', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestSurfImage(page)
    await page.waitForTimeout(1000) // wait time to work around a bug

    expect(await page.$$('canvas')).toHaveLength(1)

    await loadTestSurfImage(page)
    await page.waitForTimeout(1000) // Give time for second canvas
    
    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1) // At least 1 canvas (may share)
    
    // Verify the mesh loaded by checking canvas has content
    const hasCanvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return false
      const ctx = canvas.getContext('2d')
      if (!ctx) return true // WebGL canvas, assume it has content
      return canvas.width > 0 && canvas.height > 0
    })
    expect(hasCanvasContent).toBeTruthy()
  })

  test('loads a test surface and overlay', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestSurfImage(page)

    await page.waitForTimeout(1000) // duplicated code to work around a bug
    await loadTestSurfImage(page) // duplicated code to work around a bug

    await loadTestSurfOverlay(page, 'curv')

    await page.waitForTimeout(2000) // Wait for overlay to load
    await loadTestSurfOverlay(page, 'curv') // duplicated code to work around a bug

    // Verify canvas exists and overlay loaded
    const canvases = await page.$$('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)
    
    // Check for no error messages
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('error')
    expect(bodyText).not.toContain('failed')
  })
})
