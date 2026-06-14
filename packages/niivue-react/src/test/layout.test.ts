import { describe, expect, it } from 'vitest'
import { SLICE_TYPE } from '@niivue/niivue'
import { TILE_BORDER, TILE_MARGIN, getCanvasSize } from '../layout'

// A brain-shaped volume similar to the one in the bug report
// (207 x 256 x 215 @ 0.74mm) plus a couple of other shapes.
const META = { nx: 207, ny: 256, nz: 215, dx: 0.74, dy: 0.74, dz: 0.74 }
const META_SQUARE = { nx: 100, ny: 100, nz: 100, dx: 1, dy: 1, dz: 1 }
const META_WIDE = { nx: 256, ny: 64, nz: 64, dx: 1, dy: 1, dz: 1 }

const WINDOWS = [
  { width: 1920, height: 520 }, // wide + short: the row-overflow case
  { width: 1280, height: 800 },
  { width: 1000, height: 1000 },
  { width: 600, height: 900 }, // tall + narrow
  { width: 360, height: 640 },
]

const SLICE_TYPES = [
  SLICE_TYPE.AXIAL,
  SLICE_TYPE.CORONAL,
  SLICE_TYPE.SAGITTAL,
  SLICE_TYPE.MULTIPLANAR,
]

const SPACINGS = [0, 2, 4, 8, 16, 32]

// The invariant the old code violated: every tile (including its 1px border on
// each side) plus the inter-tile gaps must fit inside the drawable area, on both
// axes. If this holds, nothing wraps into a clipped row or spills off the side.
function expectFits(
  layout: { width: number; height: number; cols: number; rows: number },
  win: { width: number; height: number },
  nCanvas: number,
  gap: number,
) {
  const availWidth = win.width - 2 * TILE_MARGIN
  const availHeight = win.height - 2 * TILE_MARGIN

  const rowFootprint = layout.cols * (layout.width + TILE_BORDER) + (layout.cols - 1) * gap
  const colFootprint = layout.rows * (layout.height + TILE_BORDER) + (layout.rows - 1) * gap

  expect(rowFootprint).toBeLessThanOrEqual(availWidth)
  expect(colFootprint).toBeLessThanOrEqual(availHeight)
  // The grid must have room for every canvas.
  expect(layout.cols * layout.rows).toBeGreaterThanOrEqual(nCanvas)
  // A real viewport should always yield a drawable tile.
  expect(layout.width).toBeGreaterThan(0)
}

describe('getCanvasSize', () => {
  it('packs tiles without overflowing for any count / window / view / spacing', () => {
    for (const win of WINDOWS) {
      for (const sliceType of SLICE_TYPES) {
        for (const meta of [META, META_SQUARE, META_WIDE]) {
          for (const gap of SPACINGS) {
            for (let n = 1; n <= 12; n++) {
              const layout = getCanvasSize(n, meta, sliceType, win, gap)
              expectFits(layout, win, n, gap)
            }
          }
        }
      }
    }
  })

  it('regression: 6 axial tiles in a wide, short window do not spill into a clipped row', () => {
    // Mirrors the first screenshot: a single row was computed but the tiles were
    // sized too large, so the 6th wrapped into a second, clipped row.
    const win = { width: 1920, height: 520 }
    const layout = getCanvasSize(6, META, SLICE_TYPE.AXIAL, win, 4)
    expectFits(layout, win, 6, 4)
  })

  it('regression: 7 tiles fit within the viewport width', () => {
    // Mirrors the second screenshot: the last tile was cut off on the right.
    const win = { width: 2000, height: 700 }
    const layout = getCanvasSize(7, META, SLICE_TYPE.AXIAL, win, 4)
    expectFits(layout, win, 7, 4)
  })

  it('larger spacing yields equal-or-smaller tiles (never larger)', () => {
    const win = { width: 1280, height: 800 }
    let prev = Infinity
    for (const gap of [0, 4, 8, 16, 32]) {
      const { width } = getCanvasSize(8, META, SLICE_TYPE.AXIAL, win, gap)
      expect(width).toBeLessThanOrEqual(prev)
      prev = width
    }
  })

  it('treats an empty viewer as a single tile', () => {
    const win = { width: 1280, height: 800 }
    const layout = getCanvasSize(0, META, SLICE_TYPE.AXIAL, win, 4)
    expect(layout.cols).toBe(1)
    expect(layout.rows).toBe(1)
    expect(layout.width).toBeGreaterThan(0)
  })
})
