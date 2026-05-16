import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test('probe: drop sphere.mhd + sphere.raw together — PWA detects the pair', async ({
  page,
}) => {
  const consoleEvents: string[] = []
  page.on('console', (msg) => consoleEvents.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleEvents.push(`[pageerror] ${err.message}`))

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Fetch both files and synthesize a DataTransfer drop event on the ImageDrop region.
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
    dt.items.add(mhdFile)
    dt.items.add(rawFile)
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

  await page.screenshot({ path: 'test-results/sphere-mhd-drop-render.png', fullPage: true })
  console.log('DROP_STATUS', JSON.stringify(status))
  console.log('DROP_CONSOLE', JSON.stringify(consoleEvents.slice(-30)))
  expect(status.loadedCount).toBeGreaterThan(0)
  expect(status.canvasCount).toBe(1) // pair should collapse to 1 image, not 2
})
