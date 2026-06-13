import { SLICE_TYPE } from '@niivue/niivue'

/**
 * Pure geometry for the canvas-tile grid. Kept free of preact/DOM imports so the
 * packing math can be unit-tested in isolation (see test/layout.test.ts).
 */

export type Size = {
  height: number
  width: number
}

export type Layout = {
  width: number
  height: number
  cols: number
  rows: number
}

// Geometry the tile grid must budget for so the chosen tile size actually fits.
// TILE_MARGIN mirrors the `m-1` wrapper margin (0.25rem) around the grid and
// TILE_BORDER mirrors the 1px border on each side of `.nv-pane` (see Volume.css).
export const TILE_MARGIN = 4
export const TILE_BORDER = 2

export function getAspectRatio(meta: any, sliceType: number) {
  if (!meta.nx) {
    return 1
  }
  const xSize = meta.nx * meta.dx
  const ySize = meta.ny * meta.dy
  const zSize = meta.nz * meta.dz
  if (sliceType === SLICE_TYPE.AXIAL) {
    return xSize / ySize
  } else if (sliceType === SLICE_TYPE.CORONAL) {
    return xSize / zSize
  } else if (sliceType === SLICE_TYPE.SAGITTAL) {
    return ySize / zSize
  } else if (sliceType === SLICE_TYPE.MULTIPLANAR) {
    return (xSize + ySize) / (zSize + ySize)
  }
  return 1
}

// Pick the tile size and column/row count that pack `nCanvas` aspect-correct
// tiles into the viewport without overflowing. The previous version subtracted a
// single gap per axis and ignored the per-tile border and the wrapper margin, so
// the tiles came out slightly too large: the flex row then fit one fewer tile
// than intended and the overflow wrapped into a clipped extra row. Here every
// consumer of space is budgeted explicitly, and the chosen `cols`/`rows` are
// returned so the grid can render exactly that many columns.
export function getCanvasSize(
  nCanvas: number,
  meta: any,
  sliceType: number,
  windowSize: Size,
  gap: number,
): Layout {
  const aspectRatio = getAspectRatio(meta, sliceType)
  if (nCanvas < 1) {
    nCanvas = 1
  }

  // Drawable area once the wrapper's outer margin is removed.
  const availWidth = windowSize.width - 2 * TILE_MARGIN
  const availHeight = windowSize.height - 2 * TILE_MARGIN

  let best: Layout = { width: 0, height: 0, cols: 1, rows: 1 }
  for (let rows = 1; rows <= nCanvas; rows++) {
    const cols = Math.ceil(nCanvas / rows)
    // Space available to a single tile after removing the inter-tile gaps
    // ((n-1) per axis) and that tile's own border, divided across the track.
    const tileWidth = (availWidth - (cols - 1) * gap) / cols - TILE_BORDER
    const tileHeight = (availHeight - (rows - 1) * gap) / rows - TILE_BORDER
    // Largest aspect-correct width that fits both the width and height budgets.
    const width = Math.floor(Math.min(tileWidth, tileHeight * aspectRatio))
    if (width > best.width) {
      best = {
        width,
        height: Math.floor(width / aspectRatio),
        cols,
        rows,
      }
    }
  }
  // Guard against degenerate (tiny / pre-measurement) viewports.
  best.width = Math.max(0, best.width)
  best.height = Math.max(0, best.height)
  return best
}
