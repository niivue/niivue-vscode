// Structural mirror of @niivue/niivue's LUT (a color table): the package does
// not re-export the LUT type from its root, and we only need these two fields.
export interface ColorLUT {
  lut: Uint8ClampedArray
  labels?: string[]
}

// Minimal shape of the parts of an NVImage we inspect for label detection.
interface LabelImage {
  img?: ArrayLike<number> | null
  colormapLabel?: ColorLUT | null
  hdr?: { datatypeCode?: number; intent_code?: number } | null
}

export interface LabelInfo {
  value: number
  name?: string
  color: [number, number, number]
  visible: boolean
}

// NIfTI datatype codes for integer voxels. Segmentations/atlases are integer;
// continuous anatomical/statistical images are float (16, 64, 1536) and are not
// label maps, so the per-label controls never apply to them.
const INTEGER_DATATYPE_CODES = new Set([2, 4, 8, 256, 512, 768, 1024, 1280])
// NIFTI_INTENT_LABEL — a hard signal that the image *is* a label map.
const NIFTI_INTENT_LABEL = 1002
// Upper bounds that keep a stray continuous image from being treated as labels
// (and keep the built LUT a sane size). Real atlases stay well under these.
const MAX_DISTINCT_LABELS = 8192
const MAX_LABEL_VALUE = 65535

/**
 * A label/segmentation overlay is one that already carries a colormapLabel (the
 * LUT produced when a volume is loaded with a colour table). The per-label
 * controls key off this.
 */
export function isLabelOverlay(overlay: { colormapLabel?: ColorLUT | null } | null | undefined): boolean {
  return overlay?.colormapLabel !== null && overlay?.colormapLabel !== undefined
}

/** Integer voxel data — the precondition for offering label controls. */
export function isIntegerVolume(overlay: LabelImage | null | undefined): boolean {
  const code = overlay?.hdr?.datatypeCode
  return typeof code === 'number' && INTEGER_DATATYPE_CODES.has(code)
}

/** NIFTI_INTENT_LABEL: the image declares itself a label map, so auto-enable. */
export function isAutoLabelMap(overlay: LabelImage | null | undefined): boolean {
  return overlay?.hdr?.intent_code === NIFTI_INTENT_LABEL
}

/**
 * Scan voxel data for the distinct non-zero integer values (the labels). Returns
 * them sorted, or null when the data does not look like a label map — too many
 * distinct values (a continuous image) or values too large to index a LUT. The
 * early-exit keeps continuous images cheap: they blow past the cap almost
 * immediately, so the scan stops long before reading the whole volume.
 */
export function getUniqueLabelValues(
  img: ArrayLike<number> | null | undefined,
  maxDistinct = MAX_DISTINCT_LABELS,
): number[] | null {
  if (!img || typeof img.length !== 'number') {
    return null
  }
  const values = new Set<number>()
  for (let i = 0; i < img.length; i++) {
    const rounded = Math.round(img[i])
    if (rounded === 0 || rounded < 0) {
      continue
    }
    if (!values.has(rounded)) {
      if (rounded > MAX_LABEL_VALUE || values.size >= maxDistinct) {
        return null
      }
      values.add(rounded)
    }
  }
  return Array.from(values).sort((a, b) => a - b)
}

/**
 * Deterministic, visually distinct colour for a label value, using the golden
 * angle so adjacent label values land far apart on the hue wheel.
 */
export function generateLabelColor(value: number): [number, number, number] {
  const hue = (value * 137.508) % 360
  const saturation = 0.7
  const lightness = 0.6
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness - c / 2
  let r, g, b
  if (hue < 60) {
    r = c
    g = x
    b = 0
  } else if (hue < 120) {
    r = x
    g = c
    b = 0
  } else if (hue < 180) {
    r = 0
    g = c
    b = x
  } else if (hue < 240) {
    r = 0
    g = x
    b = c
  } else if (hue < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/**
 * Build a colormapLabel (color table) for a set of label values that has no LUT
 * of its own. The LUT is indexed by value: present labels get a generated colour
 * at full alpha, every other slot stays transparent (so getOverlayLabels lists
 * exactly the present labels and NiiVue renders only them).
 */
export function buildColormapLabel(values: number[]): ColorLUT {
  const maxValue = values.length ? values[values.length - 1] : 0
  const lut = new Uint8ClampedArray((maxValue + 1) * 4)
  for (const value of values) {
    if (value < 0) {
      continue
    }
    const [r, g, b] = generateLabelColor(value)
    const offset = value * 4
    lut[offset] = r
    lut[offset + 1] = g
    lut[offset + 2] = b
    lut[offset + 3] = 255
  }
  return { lut }
}

// Cache the (one-time) voxel scan per image so reopening the ColorScale does not
// rescan. Keyed by the NVImage object, so it is dropped when the image is.
const scanCache = new WeakMap<object, number[] | null>()

/**
 * Determine the label values for an integer overlay, scanning once and caching.
 * Returns null for non-integer images or data that does not look like labels.
 */
export function detectLabelValues(overlay: LabelImage | null | undefined): number[] | null {
  if (!overlay || !isIntegerVolume(overlay)) {
    return null
  }
  if (scanCache.has(overlay as object)) {
    return scanCache.get(overlay as object) ?? null
  }
  const values = getUniqueLabelValues(overlay.img)
  scanCache.set(overlay as object, values)
  return values
}

/**
 * Union the label values of several overlays (one per selected canvas). Only
 * overlays that look like integer label maps contribute; others are skipped.
 * The single colour table built from this union renders correctly on every
 * canvas, even when the open files use different label ranges - which is why
 * building from the union (not just the first canvas) is what makes the
 * per-label controls work for multiple files at once.
 */
export function detectLabelValuesAcross(
  overlays: Array<LabelImage | null | undefined>,
): number[] {
  const union = new Set<number>()
  for (const overlay of overlays) {
    const values = detectLabelValues(overlay)
    if (values) {
      for (const value of values) {
        union.add(value)
      }
    }
  }
  return Array.from(union).sort((a, b) => a - b)
}

/**
 * Merge per-canvas label lists into one, keyed by value, so a value shared
 * across files appears once and toggling it affects every canvas that contains
 * it. The first occurrence of a value keeps its name and colour; a label counts
 * as visible only when it is visible in every list that contains it.
 */
export function mergeLabelLists(lists: LabelInfo[][]): LabelInfo[] {
  const byValue = new Map<number, LabelInfo>()
  for (const list of lists) {
    for (const label of list) {
      const existing = byValue.get(label.value)
      if (existing) {
        existing.visible = existing.visible && label.visible
      } else {
        byValue.set(label.value, { ...label })
      }
    }
  }
  return Array.from(byValue.values()).sort((a, b) => a.value - b.value)
}

/**
 * Build the label list from the overlay's LUT rather than scanning voxel data.
 * The LUT already enumerates every defined label (colour + optional name), so
 * this is both cheaper and complete - a voxel scan has to be capped for large
 * volumes and then silently misses labels that only occur past the cap.
 *
 * Index 0 is the background and is intentionally omitted (hiding it is the job
 * of the separate "Hide 0" control).
 */
export function getOverlayLabels(
  colormapLabel: ColorLUT | null | undefined,
  visibility: Record<number, boolean> = {},
): LabelInfo[] {
  const lut = colormapLabel?.lut
  if (!lut) {
    return []
  }
  const names = colormapLabel?.labels
  const count = names?.length ?? Math.floor(lut.length / 4)
  const labels: LabelInfo[] = []
  for (let value = 1; value < count; value++) {
    const offset = value * 4
    if (offset + 3 >= lut.length) {
      break
    }
    // Without a names table, a fully transparent slot is LUT padding rather
    // than a real label, so skip it. Named entries are always kept.
    if (!names && lut[offset + 3] === 0) {
      continue
    }
    labels.push({
      value,
      name: names?.[value] || `Label ${value}`,
      color: [lut[offset], lut[offset + 1], lut[offset + 2]],
      visible: visibility[value] ?? true,
    })
  }
  return labels
}

/**
 * Return a copy of the LUT with the alpha byte of each listed label set to
 * opaque (255) or transparent (0) according to `visibility`. Labels absent from
 * the map are left untouched. Showing a label resets it to fully opaque, which
 * matches the original colour-table behaviour for label overlays.
 */
export function applyLabelVisibility(
  lut: Uint8ClampedArray,
  visibility: Record<number, boolean>,
): Uint8ClampedArray {
  const next = new Uint8ClampedArray(lut)
  for (const [key, visible] of Object.entries(visibility)) {
    const alphaIndex = Number(key) * 4 + 3
    if (alphaIndex >= 0 && alphaIndex < next.length) {
      next[alphaIndex] = visible ? 255 : 0
    }
  }
  return next
}
