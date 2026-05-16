import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test('probe: load sphere.mhd via binary buffer (simulates vscode "outside workspace" path)', async ({
  page,
}) => {
  const consoleEvents: string[] = []
  page.on('console', (msg) => consoleEvents.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleEvents.push(`[pageerror] ${err.message}`))

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Fetch both files first, then send as ArrayBuffer like the vscode extension does.
  const result = await page.evaluate(async (base) => {
    const mhdResp = await fetch(base + 'sphere.mhd')
    const rawResp = await fetch(base + 'sphere.raw')
    const mhdBuf = await mhdResp.arrayBuffer()
    const rawBuf = await rawResp.arrayBuffer()
    window.postMessage(
      {
        type: 'addImage',
        body: {
          uri: 'file:///c:/tmp/sphere.mhd',
          data: mhdBuf,
          pairedData: rawBuf,
        },
      },
      '*',
    )
    return { mhdBytes: mhdBuf.byteLength, rawBytes: rawBuf.byteLength }
  }, BASE_URL)

  console.log('FETCHED', JSON.stringify(result))

  const loaded = await page
    .waitForFunction(
      () => ((window as any).__niivue?.loadedCount ?? 0) > 0,
      { timeout: 15000 },
    )
    .catch(() => null)

  const status = await page.evaluate(() => {
    const w = window as any
    return {
      loadedCount: w.__niivue?.loadedCount ?? 0,
      canvasFound: !!document.querySelector('canvas'),
      bodyText: (document.body.innerText || '').slice(0, 500),
    }
  })

  await page.screenshot({ path: 'test-results/sphere-mhd-binary-render.png', fullPage: true })

  await test.info().attach('status', {
    body: JSON.stringify(status, null, 2),
    contentType: 'application/json',
  })
  await test.info().attach('console', {
    body: JSON.stringify(consoleEvents.slice(-50), null, 2),
    contentType: 'application/json',
  })

  expect(loaded, 'binary-buffer MHD should reach loadedCount > 0').not.toBeNull()
  expect(status.loadedCount, 'loadedCount should bump for paired binary MHD').toBeGreaterThan(0)
  expect(status.bodyText.includes('Failed to load'), 'no on-canvas load error').toBe(false)
})
