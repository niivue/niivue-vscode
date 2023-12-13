import { test, expect } from '@playwright/test'
import { BASE_URL, loadTestSurfImage, loadTestSurfOverlay } from './utils'

test.describe('Loading meshes', () => {
  test('loads a test surface', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestSurfImage(page)
    await page.waitForTimeout(1000) // wait time to work around a bug

    expect(await page.waitForSelector('canvas')).toBeTruthy()
    expect(await page.$$('canvas')).toHaveLength(1)

    await loadTestSurfImage(page)
    expect(await page.$$('canvas')).toHaveLength(2)

    expect(await page.textContent('text=/Number of Points: 40962/i')).toBeTruthy()
  })

  test('loads a test surface and overlay', async ({ page }) => {
    await page.goto(BASE_URL)

    await loadTestSurfImage(page)

    await page.waitForTimeout(1000) // duplicated code to work around a bug
    await loadTestSurfImage(page) // duplicated code to work around a bug

    await loadTestSurfOverlay(page, 'curv')

    await page.waitForTimeout(1000) // duplicated code to work around a bug
    await loadTestSurfOverlay(page, 'curv') // duplicated code to work around a bug
  })
})
