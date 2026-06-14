import { expect, test } from './fixtures'
import { BASE_URL, waitForImageLoad } from './utils'

test.use({ viewport: { width: 1200, height: 800 } })

// One light test on purpose. niivue runs a continuous WebGL render loop per
// canvas, and CI runs the e2e suite on a CPU-bound software-WebGL runner with 2
// parallel workers, so a test that holds many canvases starves the other worker
// and causes unrelated timeouts. We hold the minimum (two tiles, the same weight
// as Images.spec, which the suite already tolerates), do it in a single
// navigation, mark it slow, and give loads/reactive waits generous timeouts. The
// exhaustive tile-packing math lives in the layout unit tests; this is a thin
// integration smoke check that the computed sizes render without overflow, react
// to the tileSpacing setting, and that the View menu control is wired up.

async function loadImage(page: import('@playwright/test').Page) {
  await page.evaluate(
    (uri) => window.postMessage({ type: 'addImage', body: { data: '', uri } }, '*'),
    BASE_URL + 'lesion.nii.gz',
  )
  await waitForImageLoad(page, 45000)
}

async function readTiles(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const panes = Array.from(document.querySelectorAll('.nv-pane')) as HTMLElement[]
    const container = panes[0]?.parentElement as HTMLElement
    const clip = container?.parentElement as HTMLElement // .overflow-hidden sizeRef
    const box = (el: HTMLElement): any => {
      const b = el.getBoundingClientRect()
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width }
    }
    return {
      gap: parseFloat(getComputedStyle(container).gap) || 0,
      panes: panes.map(box) as any[],
      clip: box(clip),
      count: panes.length,
    }
  })
}

function expectAllTilesFit(g: { panes: any[]; clip: any }) {
  for (const p of g.panes) {
    expect(p.width).toBeGreaterThan(20) // guards against a collapsed layout
    expect(p.right).toBeLessThanOrEqual(g.clip.right + 1)
    expect(p.bottom).toBeLessThanOrEqual(g.clip.bottom + 1)
    expect(p.left).toBeGreaterThanOrEqual(g.clip.left - 1)
    expect(p.top).toBeGreaterThanOrEqual(g.clip.top - 1)
  }
}

test('tiles fit, react to tileSpacing, and the View stepper is wired up', async ({ page }) => {
  test.slow() // CPU-bound software WebGL on CI; allow extra time under load.
  await page.goto(BASE_URL)
  await loadImage(page)
  await loadImage(page)
  expect(await page.$$('canvas')).toHaveLength(2)

  // 1) Tiles fit with no overflow / clipped row.
  const before = await readTiles(page)
  expect(before.count).toBe(2)
  expectAllTilesFit(before)

  // 2) The tileSpacing setting drives the gap and tiles stay fit. Driven
  //    directly because the menu button's position depends on overflow state.
  await page.evaluate(() => {
    const ap = (window as any).appProps
    ap.settings.value = { ...ap.settings.value, tileSpacing: 24 }
  })
  await expect.poll(async () => (await readTiles(page)).gap, { timeout: 25000 }).toBe(24)
  expectAllTilesFit(await readTiles(page))

  // 3) The View menu exposes a working Tile Spacing stepper (inline or via the
  //    adaptive overflow "More" menu).
  const inlineView = page.locator('data-testid=menu-item-dropdown-View')
  if (await inlineView.count()) {
    await inlineView.click()
  } else {
    await page.getByTestId('menu-overflow').click()
    await page.getByTestId('menu-overflow-group-View').click()
  }
  const value = page.getByTestId('stepper-value-Tile Spacing')
  await expect(value).toBeVisible()
  const current = await value.textContent()
  await page.click('[aria-label="Increase Tile Spacing"]')
  await expect(value).not.toHaveText(current ?? '')
})
