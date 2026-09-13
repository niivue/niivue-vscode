import { describe, expect, it } from 'vitest'
import {
  applyLabelVisibility,
  buildColormapLabel,
  detectLabelValues,
  detectLabelValuesAcross,
  generateLabelColor,
  getOverlayLabels,
  getUniqueLabelValues,
  isAutoLabelMap,
  isIntegerVolume,
  isLabelOverlay,
  mergeLabelLists,
} from '../components/labelSelection'

// Build a colour-table LUT from RGBA tuples. The voxel value N indexes the LUT
// at byte offset N*4, so tuple 0 is the background (label 0).
function makeLut(entries: [number, number, number, number][], labels?: string[]) {
  const lut = new Uint8ClampedArray(entries.flatMap((e) => e))
  return labels ? { lut, labels } : { lut }
}

describe('isLabelOverlay', () => {
  it('is false when there is no overlay', () => {
    expect(isLabelOverlay(null)).toBe(false)
    expect(isLabelOverlay(undefined)).toBe(false)
  })

  it('is false when colormapLabel is absent or null', () => {
    expect(isLabelOverlay({})).toBe(false)
    expect(isLabelOverlay({ colormapLabel: null })).toBe(false)
  })

  it('is true when the overlay carries a colormapLabel', () => {
    expect(isLabelOverlay({ colormapLabel: makeLut([[0, 0, 0, 0]]) })).toBe(true)
  })
})

describe('getOverlayLabels', () => {
  it('returns an empty list without a LUT', () => {
    expect(getOverlayLabels(null)).toEqual([])
    expect(getOverlayLabels(undefined)).toEqual([])
  })

  it('builds one entry per label, skipping the background (index 0)', () => {
    const colormapLabel = makeLut(
      [
        [0, 0, 0, 0],
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
      ],
      ['Background', 'Cube', 'Sphere', 'Slice'],
    )
    expect(getOverlayLabels(colormapLabel)).toEqual([
      { value: 1, name: 'Cube', color: [255, 0, 0], visible: true },
      { value: 2, name: 'Sphere', color: [0, 255, 0], visible: true },
      { value: 3, name: 'Slice', color: [0, 0, 255], visible: true },
    ])
  })

  it('falls back to "Label N" when a name is missing', () => {
    const colormapLabel = makeLut(
      [
        [0, 0, 0, 0],
        [10, 20, 30, 255],
        [40, 50, 60, 255],
      ],
      ['Background', '', ''],
    )
    expect(getOverlayLabels(colormapLabel).map((l) => l.name)).toEqual(['Label 1', 'Label 2'])
  })

  it('marks all labels visible by default and respects a visibility map', () => {
    const colormapLabel = makeLut([
      [0, 0, 0, 0],
      [1, 1, 1, 255],
      [2, 2, 2, 255],
    ])
    const labels = getOverlayLabels(colormapLabel, { 2: false })
    expect(labels.find((l) => l.value === 1)?.visible).toBe(true)
    expect(labels.find((l) => l.value === 2)?.visible).toBe(false)
  })

  it('skips fully transparent padding slots when there is no name table', () => {
    const colormapLabel = makeLut([
      [0, 0, 0, 0], // 0 background (always skipped)
      [255, 0, 0, 255], // 1 real label
      [0, 0, 0, 0], // 2 transparent padding -> skipped
      [0, 0, 255, 255], // 3 real label
    ])
    expect(getOverlayLabels(colormapLabel).map((l) => l.value)).toEqual([1, 3])
  })
})

describe('applyLabelVisibility', () => {
  const baseLut = () =>
    new Uint8ClampedArray([
      0, 0, 0, 0, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
    ])

  it('sets the alpha byte to 0 for hidden labels and 255 for shown labels', () => {
    const next = applyLabelVisibility(baseLut(), { 1: false, 3: true })
    expect(next[1 * 4 + 3]).toBe(0) // label 1 hidden
    expect(next[3 * 4 + 3]).toBe(255) // label 3 shown
    expect(next[2 * 4 + 3]).toBe(255) // label 2 untouched (not in map)
  })

  it('restores a dimmed label to fully opaque when shown', () => {
    const lut = baseLut()
    lut[1 * 4 + 3] = 100
    const next = applyLabelVisibility(lut, { 1: true })
    expect(next[1 * 4 + 3]).toBe(255)
  })

  it('does not mutate the input LUT', () => {
    const lut = baseLut()
    const snapshot = Uint8ClampedArray.from(lut)
    applyLabelVisibility(lut, { 1: false })
    expect(lut).toEqual(snapshot)
  })

  it('ignores indices outside the LUT', () => {
    const next = applyLabelVisibility(baseLut(), { 99: false })
    expect(next).toEqual(baseLut())
  })
})

describe('isIntegerVolume', () => {
  it('is true for integer NIfTI datatype codes', () => {
    for (const code of [2, 4, 8, 256, 512, 768]) {
      expect(isIntegerVolume({ hdr: { datatypeCode: code } })).toBe(true)
    }
  })

  it('is false for float datatypes and when the header is missing', () => {
    expect(isIntegerVolume({ hdr: { datatypeCode: 16 } })).toBe(false) // float32
    expect(isIntegerVolume({ hdr: { datatypeCode: 64 } })).toBe(false) // float64
    expect(isIntegerVolume({})).toBe(false)
    expect(isIntegerVolume(null)).toBe(false)
  })
})

describe('isAutoLabelMap', () => {
  it('is true only for NIFTI_INTENT_LABEL (1002)', () => {
    expect(isAutoLabelMap({ hdr: { intent_code: 1002 } })).toBe(true)
    expect(isAutoLabelMap({ hdr: { intent_code: 0 } })).toBe(false)
    expect(isAutoLabelMap({})).toBe(false)
  })
})

describe('getUniqueLabelValues', () => {
  it('returns sorted distinct non-zero values, rounding floats', () => {
    const img = new Float32Array([0, 3, 3, 1, 2.0, 1, 0, 2])
    expect(getUniqueLabelValues(img)).toEqual([1, 2, 3])
  })

  it('returns an empty list for all-background data', () => {
    expect(getUniqueLabelValues(new Uint8Array([0, 0, 0]))).toEqual([])
  })

  it('returns null when distinct values exceed the cap (continuous image)', () => {
    const img = new Uint16Array(500)
    for (let i = 0; i < img.length; i++) img[i] = i + 1
    expect(getUniqueLabelValues(img, 100)).toBeNull()
  })

  it('returns null when a value is too large to index a LUT', () => {
    expect(getUniqueLabelValues(new Int32Array([1, 70000]))).toBeNull()
  })

  it('returns null for missing data', () => {
    expect(getUniqueLabelValues(null)).toBeNull()
    expect(getUniqueLabelValues(undefined)).toBeNull()
  })
})

describe('generateLabelColor', () => {
  it('is deterministic and stays within the 0-255 range', () => {
    const c = generateLabelColor(7)
    expect(generateLabelColor(7)).toEqual(c)
    expect(c).toHaveLength(3)
    for (const channel of c) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(255)
    }
  })

  it('gives distinct values distinct colours', () => {
    expect(generateLabelColor(1)).not.toEqual(generateLabelColor(2))
  })
})

describe('buildColormapLabel', () => {
  it('builds a LUT indexed by value: present labels opaque, gaps transparent', () => {
    const { lut } = buildColormapLabel([1, 3])
    expect(lut.length).toBe((3 + 1) * 4)
    expect(lut[1 * 4 + 3]).toBe(255) // label 1 present
    expect(lut[3 * 4 + 3]).toBe(255) // label 3 present
    expect(lut[2 * 4 + 3]).toBe(0) // gap (label 2) transparent
    expect(lut[0 * 4 + 3]).toBe(0) // background transparent
  })

  it('round-trips through getOverlayLabels to exactly the present values', () => {
    const colormapLabel = buildColormapLabel([1, 2, 5])
    expect(getOverlayLabels(colormapLabel).map((l) => l.value)).toEqual([1, 2, 5])
  })
})

describe('detectLabelValues', () => {
  it('scans an integer image for its label values', () => {
    const overlay = { hdr: { datatypeCode: 2 }, img: new Uint8Array([0, 1, 2, 2, 4]) }
    expect(detectLabelValues(overlay)).toEqual([1, 2, 4])
  })

  it('returns null for a float (non-label) image', () => {
    const overlay = { hdr: { datatypeCode: 16 }, img: new Float32Array([0, 1.5, 2.5]) }
    expect(detectLabelValues(overlay)).toBeNull()
  })

  it('returns null when there is no overlay', () => {
    expect(detectLabelValues(null)).toBeNull()
  })
})

describe('detectLabelValuesAcross', () => {
  it('unions the label values of several integer overlays', () => {
    const a = { hdr: { datatypeCode: 2 }, img: new Uint8Array([0, 1, 2]) }
    const b = { hdr: { datatypeCode: 4 }, img: new Int16Array([0, 2, 200, 201]) }
    expect(detectLabelValuesAcross([a, b])).toEqual([1, 2, 200, 201])
  })

  it('skips non-label (float) overlays and nullish entries', () => {
    const labels = { hdr: { datatypeCode: 2 }, img: new Uint8Array([0, 5]) }
    const continuous = { hdr: { datatypeCode: 16 }, img: new Float32Array([0, 1.5]) }
    expect(detectLabelValuesAcross([labels, continuous, null, undefined])).toEqual([5])
  })

  it('returns an empty list when nothing looks like labels', () => {
    expect(detectLabelValuesAcross([])).toEqual([])
    expect(
      detectLabelValuesAcross([{ hdr: { datatypeCode: 16 }, img: new Float32Array([1.1]) }]),
    ).toEqual([])
  })
})

describe('mergeLabelLists', () => {
  it('merges by value so a shared label appears once, sorted', () => {
    const a = getOverlayLabels(buildColormapLabel([1, 2]))
    const b = getOverlayLabels(buildColormapLabel([2, 5]))
    expect(mergeLabelLists([a, b]).map((l) => l.value)).toEqual([1, 2, 5])
  })

  it('keeps a label visible only when shown in every list that contains it', () => {
    const shown = getOverlayLabels(buildColormapLabel([1]))
    const hidden = shown.map((l) => ({ ...l, visible: false }))
    expect(mergeLabelLists([shown, hidden])[0].visible).toBe(false)
    expect(mergeLabelLists([shown, shown])[0].visible).toBe(true)
  })

  it('preserves the first name and colour for a shared value', () => {
    const named = [{ value: 1, name: 'First', color: [10, 20, 30] as [number, number, number], visible: true }]
    const other = [{ value: 1, name: 'Second', color: [40, 50, 60] as [number, number, number], visible: true }]
    const merged = mergeLabelLists([named, other])
    expect(merged[0].name).toBe('First')
    expect(merged[0].color).toEqual([10, 20, 30])
  })
})
