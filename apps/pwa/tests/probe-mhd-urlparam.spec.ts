import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test('probe: ?images=sphere.mhd auto-fetches paired sphere.raw', async ({ page }) => {
  const consoleEvents: string[] = []
  page.on('console', (msg) => consoleEvents.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleEvents.push(`[pageerror] ${err.message}`))

  await page.goto(`${BASE_URL}?images=${encodeURIComponent(BASE_URL + 'sphere.mhd')}`)
  await page.waitForLoadState('networkidle')

  await page.waitForFunction(() => ((window as any).__niivue?.loadedCount ?? 0) > 0, {
    timeout: 15000,
  })

  const status = await page.evaluate(() => ({
    loadedCount: (window as any).__niivue?.loadedCount ?? 0,
    canvasCount: document.querySelectorAll('canvas').length,
    bodyText: (document.body.innerText || '').slice(0, 500),
  }))

  await page.screenshot({ path: 'test-results/sphere-mhd-urlparam-render.png', fullPage: true })
  console.log('URLPARAM_STATUS', JSON.stringify(status))
  console.log('URLPARAM_CONSOLE', JSON.stringify(consoleEvents.slice(-25)))

  expect(status.loadedCount).toBeGreaterThan(0)
  // Should show the sphere voxel values (center value 255 etc.), proving the .raw was fetched.
  expect(status.bodyText).toContain('64 x 64 x 64')
})
