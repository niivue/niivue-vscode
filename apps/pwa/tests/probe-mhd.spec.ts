import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test('probe: load sphere.mhd via URL with explicit urlImgData', async ({ page }) => {
  const consoleEvents: string[] = []
  page.on('console', (msg) => {
    consoleEvents.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => consoleEvents.push(`[pageerror] ${err.message}`))

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  const message = {
    type: 'addImage',
    body: {
      uri: BASE_URL + 'sphere.mhd',
      urlImgData: BASE_URL + 'sphere.raw',
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)

  // Wait up to 10s for loadedCount to bump or any error UI
  const result = await page
    .waitForFunction(
      () => {
        const w = window as any
        const count = w.__niivue?.loadedCount ?? 0
        const errs = document.body.innerText.includes('Failed to load')
        return count > 0 || errs ? { count, errs } : false
      },
      { timeout: 10000 },
    )
    .catch(() => null)

  const status = result ? await result.jsonValue() : { count: 0, errs: false, timedOut: true }
  // Expose the niivue instance to the probe.
  const nvDiag = await page.evaluate(() => {
    const w = window as any
    // Try to find the niivue instance via the canvas
    const canvas = document.querySelector('canvas') as any
    const nv = canvas?.NV ?? canvas?._nv ?? canvas?.niivue ?? null
    return {
      canvasFound: !!canvas,
      canvasW: canvas?.width,
      canvasH: canvas?.height,
      hasNv: !!nv,
      bodyText: (document.body.innerText || '').slice(0, 500),
    }
  })

  await page.screenshot({ path: 'test-results/sphere-mhd-render.png', fullPage: true })

  // Attach diagnostics so failures still surface logs and screenshot.
  await test.info().attach('probe-result', {
    body: JSON.stringify({ status, nvDiag }, null, 2),
    contentType: 'application/json',
  })
  await test.info().attach('console', {
    body: JSON.stringify(consoleEvents.slice(-30), null, 2),
    contentType: 'application/json',
  })

  expect(status, 'sphere.mhd should load before timeout').not.toBeNull()
  expect((status as any).count, 'loadedCount should bump for the paired MHD').toBeGreaterThan(0)
  expect((status as any).errs, 'no "Failed to load" should appear on the canvas').toBe(false)
})
