import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

// Regression: when the user starts the drag from sphere.raw, the dropped file
// list arrives as [.raw, .mhd] (reversed). The pair detection must still
// collapse this into a single image, not open two canvases.
test('probe: drop with .raw first still pairs into one image', async ({ page }) => {
  const consoleEvents: string[] = []
  page.on('console', (msg) => consoleEvents.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleEvents.push(`[pageerror] ${err.message}`))

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  await page.evaluate(async (base) => {
    const [mhdResp, rawResp] = await Promise.all([
      fetch(base + 'sphere.mhd'),
      fetch(base + 'sphere.raw'),
    ])
    const mhdBuf = await mhdResp.arrayBuffer()
    const rawBuf = await rawResp.arrayBuffer()
    const mhdFile = new File([mhdBuf], 'sphere.mhd', { type: 'application/octet-stream' })
    const rawFile = new File([rawBuf], 'sphere.raw', { type: 'application/octet-stream' })
    const dt = new DataTransfer()
    // Reversed order: .raw before .mhd
    dt.items.add(rawFile)
    dt.items.add(mhdFile)
    const target = document.querySelector('div.flex.flex-col.h-full') as HTMLElement
    if (!target) throw new Error('ImageDrop root not found')
    target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }))
    target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }))
  }, BASE_URL)

  await page.waitForFunction(() => ((window as any).__niivue?.loadedCount ?? 0) > 0, {
    timeout: 15000,
  })

  const status = await page.evaluate(() => ({
    loadedCount: (window as any).__niivue?.loadedCount ?? 0,
    canvasCount: document.querySelectorAll('canvas').length,
    bodyText: (document.body.innerText || '').slice(0, 500),
  }))

  await page.screenshot({ path: 'test-results/sphere-mhd-drop-reversed-render.png', fullPage: true })
  console.log('DROP_REV_STATUS', JSON.stringify(status))
  console.log('DROP_REV_CONSOLE', JSON.stringify(consoleEvents.slice(-30)))
  expect(status.loadedCount).toBeGreaterThan(0)
  // The bug: with .raw first, the old code pushed a solo .raw body before
  // the .mhd reached its turn, so two canvases were created. Must be 1.
  expect(status.canvasCount).toBe(1)
  expect(status.bodyText).toContain('64 x 64 x 64')
})
