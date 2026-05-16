import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

// User-facing UX: dropping only sphere.mhd (no .raw) should not silently render
// black. It should surface the existing on-canvas error overlay (nv.loadError
// rendered by Volume.tsx) explaining that the paired voxel file is required.
test('probe: dropping only .mhd shows on-canvas paired-data warning', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  await page.evaluate(async (base) => {
    const mhdResp = await fetch(base + 'sphere.mhd')
    const mhdBuf = await mhdResp.arrayBuffer()
    const mhdFile = new File([mhdBuf], 'sphere.mhd', { type: 'application/octet-stream' })
    const dt = new DataTransfer()
    dt.items.add(mhdFile)
    const target = document.querySelector('div.flex.flex-col.h-full') as HTMLElement
    if (!target) throw new Error('ImageDrop root not found')
    target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }))
    target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }))
  }, BASE_URL)

  // Wait for the canvas to be created and the loadError to render.
  await page.waitForFunction(
    () => document.body.innerText.toLowerCase().includes('missing paired data file'),
    { timeout: 10000 },
  )

  const bodyText = await page.evaluate(() => document.body.innerText)
  expect(bodyText.toLowerCase()).toContain('missing paired data file')
  expect(bodyText).toContain('sphere.raw')
  // No volume loaded — only an error overlay.
  await page.screenshot({ path: 'test-results/sphere-mhd-unpaired-render.png', fullPage: true })
})
