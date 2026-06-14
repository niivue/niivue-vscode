import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage } from './utils'

// A generous viewport so several tiles share a row.
test.use({ viewport: { width: 1600, height: 900 } })

// Each case spins up several WebGL canvases; running them concurrently against
// the single preview server starves the image loads. Keep them sequential and
// load only as many images as each assertion needs (the exhaustive size math is
// covered by the layout unit tests, not here).
test.describe.configure({ mode: 'serial' })

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number }

// Reads the tile container, its tiles, and the clipping ancestor so assertions
// can talk about real on-screen pixels.
async function readTiles(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const panes = Array.from(document.querySelectorAll('.nv-pane')) as HTMLElement[]
    const container = panes[0]?.parentElement as HTMLElement
    const clip = container?.parentElement as HTMLElement // .overflow-hidden sizeRef
    const box = (el: HTMLElement): any => {
      const b = el.getBoundingClientRect()
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height }
    }
    return {
      gap: parseFloat(getComputedStyle(container).gap) || 0,
      panes: panes.map(box) as any[],
      clip: box(clip),
      count: panes.length,
    }
  })
}

// Every tile (border included) must sit inside the clipping container: nothing
// cut off on the right (screenshot 2) and no row spilling past the bottom into a
// clipped row (screenshot 1). A 1px tolerance absorbs sub-pixel rounding.
function expectAllTilesFit(g: { panes: Box[]; clip: Box }) {
  for (const p of g.panes) {
    expect(p.width).toBeGreaterThan(20) // guards against a collapsed layout
    expect(p.right).toBeLessThanOrEqual(g.clip.right + 1)
    expect(p.bottom).toBeLessThanOrEqual(g.clip.bottom + 1)
    expect(p.left).toBeGreaterThanOrEqual(g.clip.left - 1)
    expect(p.top).toBeGreaterThanOrEqual(g.clip.top - 1)
  }
}

test.describe('Tile layout', () => {
  test('tiles fit, and the tileSpacing setting drives the gap while staying fit', async ({
    page,
  }) => {
    await page.goto(BASE_URL)
    for (let i = 0; i < 5; i++) await loadTestImage(page)
    expect(await page.$$('canvas')).toHaveLength(5)

    const before = await readTiles(page)
    expect(before.count).toBe(5)
    expectAllTilesFit(before)

    // Drive the setting directly. The menu button's position depends on the
    // adaptive overflow state; the setting -> layout wiring is what matters here.
    await page.evaluate(() => {
      const ap = (window as any).appProps
      ap.settings.value = { ...ap.settings.value, tileSpacing: 24 }
    })
    await expect.poll(async () => (await readTiles(page)).gap).toBe(24)

    const after = await readTiles(page)
    expect(after.gap).toBeGreaterThan(before.gap)
    expectAllTilesFit(after)
  })

  test('View menu exposes a working Tile Spacing stepper', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)

    // Open the View menu inline if it fits, otherwise via the overflow "More" menu.
    const inlineView = page.locator('data-testid=menu-item-dropdown-View')
    if (await inlineView.count()) {
      await inlineView.click()
    } else {
      await page.getByTestId('menu-overflow').click()
      await page.getByTestId('menu-overflow-group-View').click()
    }

    const value = page.getByTestId('stepper-value-Tile Spacing')
    await expect(value).toBeVisible()
    const before = await value.textContent()
    await page.click('[aria-label="Increase Tile Spacing"]')
    expect(await value.textContent()).not.toBe(before)
  })
})
