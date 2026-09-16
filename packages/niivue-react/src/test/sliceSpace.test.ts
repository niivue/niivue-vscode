import { describe, expect, it, vi } from 'vitest'
import {
    Affine,
    applySliceSpace,
    invertAffine,
    isSameAffine,
    multiplyAffine,
    orthogonalizeAffine,
    voxelSpaceCorrection,
} from '../sliceSpace'

const IDENTITY: Affine = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

// A plain axial 2mm volume: already on its voxel grid.
const AXIAL: Affine = [
  [2, 0, 0, -90],
  [0, 2, 0, -126],
  [0, 0, 2, -72],
  [0, 0, 0, 1],
]

// 30 degrees of in-plane rotation about z, 1mm isotropic, origin at voxel 0.
const COS30 = Math.cos(Math.PI / 6)
const OBLIQUE: Affine = [
  [COS30, -0.5, 0, 0],
  [0.5, COS30, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

function expectAffineClose(actual: Affine | null, expected: Affine, precision = 6) {
  expect(actual).not.toBeNull()
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      expect(actual![r][c]).toBeCloseTo(expected[r][c], precision)
    }
  }
}

describe('affine helpers', () => {
  it('multiplies row-major 4x4 matrices', () => {
    expectAffineClose(multiplyAffine(AXIAL, IDENTITY), AXIAL)
    // Translating by one voxel along x shifts the origin by the voxel size.
    const shift: Affine = [
      [1, 0, 0, 1],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]
    expect(multiplyAffine(AXIAL, shift)[0][3]).toBeCloseTo(-88, 6)
  })

  it('inverts an affine and reports singular ones', () => {
    expectAffineClose(multiplyAffine(OBLIQUE, invertAffine(OBLIQUE)!), IDENTITY)
    expectAffineClose(multiplyAffine(AXIAL, invertAffine(AXIAL)!), IDENTITY)
    const flat: Affine = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1],
    ]
    expect(invertAffine(flat)).toBeNull()
  })
})

describe('orthogonalizeAffine', () => {
  it('leaves an axis-aligned affine alone', () => {
    expectAffineClose(orthogonalizeAffine(AXIAL), AXIAL)
  })

  it('drops the rotation of an oblique affine', () => {
    // Pure rotation of a 1mm isotropic volume about the origin voxel: the
    // nearest axis-aligned affine is the identity.
    expectAffineClose(orthogonalizeAffine(OBLIQUE), IDENTITY)
  })

  it('keeps voxel size and origin voxel when removing shear', () => {
    // Shear applied to a 3mm slice direction, so the voxel size along z is not 3.
    const sheared: Affine = [
      [1, 0, 0.3, -90],
      [0, 1, 0, -126],
      [0, 0, 3, -60],
      [0, 0, 0, 1],
    ]
    const ortho = orthogonalizeAffine(sheared)!
    expect(ortho[0][2]).toBe(0)
    expect(ortho[2][2]).toBeCloseTo(Math.hypot(0.3, 0, 3), 6)
    // The world origin must stay on the same voxel, otherwise the crosshair jumps.
    const before = invertAffine(sheared)!
    const after = invertAffine(ortho)!
    for (let r = 0; r < 3; r++) {
      expect(after[r][3]).toBeCloseTo(before[r][3], 6)
    }
  })

  it('keeps axis order and sign, so voxels are not permuted or mirrored', () => {
    // LAS-style: x decreases with the column index.
    const las: Affine = [
      [-1, 0.1, 0, 90],
      [0, 1, 0, -126],
      [0, 0, 1, -72],
      [0, 0, 0, 1],
    ]
    const ortho = orthogonalizeAffine(las)!
    expect(ortho[0][0]).toBeLessThan(0)
    expect(ortho[0][1]).toBe(0)
    expect(ortho[1][0]).toBe(0)

    // Sagittal acquisition: column 0 runs along RAS y, column 1 along -z,
    // column 2 along x. Already axis-aligned, just permuted, so nothing changes.
    const sagittal: Affine = [
      [0, 0, 1, -70],
      [1, 0, 0, -90],
      [0, -1, 0, 90],
      [0, 0, 0, 1],
    ]
    expectAffineClose(orthogonalizeAffine(sagittal), sagittal)
  })

  it('rejects a degenerate affine', () => {
    const zeroColumn: Affine = [
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]
    expect(orthogonalizeAffine(zeroColumn)).toBeNull()
  })
})

describe('voxelSpaceCorrection', () => {
  it('is null when the background is already axis-aligned', () => {
    expect(voxelSpaceCorrection({ originalAffine: AXIAL } as any)).toBeNull()
    expect(voxelSpaceCorrection(undefined)).toBeNull()
    expect(voxelSpaceCorrection({} as any)).toBeNull()
  })

  it('maps the background onto its own voxel grid', () => {
    const correction = voxelSpaceCorrection({ originalAffine: OBLIQUE } as any)!
    expectAffineClose(multiplyAffine(correction, OBLIQUE), orthogonalizeAffine(OBLIQUE)!)
  })
})

function makeNv(affines: Affine[]) {
  return {
    volumes: affines.map((originalAffine, i) => ({ originalAffine, id: `vol${i}` })),
    setVolumeAffine: vi.fn(async (_index: number, _affine: Affine) => {}),
    resetVolumeAffine: vi.fn(async (_index: number) => {}),
  }
}

describe('applySliceSpace', () => {
  it('moves every volume of a canvas by the background correction', async () => {
    // An overlay acquired on a different grid: it has to follow the background,
    // not get its own orthogonalization, or the two drift apart.
    const overlay: Affine = [
      [2, 0, 0, -90],
      [0, 2, 0, -126],
      [0, 0, 2, -72],
      [0, 0, 0, 1],
    ]
    const nv = makeNv([OBLIQUE, overlay])
    await applySliceSpace([nv] as any, false)

    const correction = voxelSpaceCorrection({ originalAffine: OBLIQUE } as any)!
    expect(nv.setVolumeAffine).toHaveBeenCalledTimes(2)
    expect(nv.setVolumeAffine.mock.calls[0][0]).toBe(0)
    expectAffineClose(nv.setVolumeAffine.mock.calls[0][1], multiplyAffine(correction, OBLIQUE))
    expect(nv.setVolumeAffine.mock.calls[1][0]).toBe(1)
    expectAffineClose(nv.setVolumeAffine.mock.calls[1][1], multiplyAffine(correction, overlay))
  })

  it('does not touch an already axis-aligned canvas', async () => {
    const nv = makeNv([AXIAL])
    await applySliceSpace([nv] as any, false)
    await applySliceSpace([nv] as any, true)
    expect(nv.setVolumeAffine).not.toHaveBeenCalled()
    expect(nv.resetVolumeAffine).not.toHaveBeenCalled()
  })

  it('is idempotent and restores world space through resetVolumeAffine', async () => {
    const nv = makeNv([OBLIQUE])
    await applySliceSpace([nv] as any, false)
    await applySliceSpace([nv] as any, false)
    expect(nv.setVolumeAffine).toHaveBeenCalledTimes(1)

    await applySliceSpace([nv] as any, true)
    await applySliceSpace([nv] as any, true)
    expect(nv.resetVolumeAffine).toHaveBeenCalledTimes(1)
    expect(nv.resetVolumeAffine).toHaveBeenCalledWith(0)

    // Back to voxel space: the volume is corrected again, not skipped.
    await applySliceSpace([nv] as any, false)
    expect(nv.setVolumeAffine).toHaveBeenCalledTimes(2)
  })

  it('brings a volume loaded later into the active space', async () => {
    const nv = makeNv([OBLIQUE])
    await applySliceSpace([nv] as any, false)
    nv.volumes.push({ originalAffine: AXIAL, id: 'late' })
    await applySliceSpace([nv] as any, false)
    expect(nv.setVolumeAffine).toHaveBeenCalledTimes(2)
    expect(nv.setVolumeAffine.mock.calls[1][0]).toBe(1)
  })

  it('skips empty canvases and survives a failing volume', async () => {
    const empty = makeNv([])
    const failing = makeNv([OBLIQUE])
    failing.setVolumeAffine = vi.fn(async (_index: number, _affine: Affine) => {
      throw new Error('no GL context')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await applySliceSpace([empty, failing] as any, false)
    expect(empty.setVolumeAffine).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('isSameAffine', () => {
  it('ignores float noise but not a real shear', () => {
    const noisy = AXIAL.map((row) => [...row])
    noisy[0][1] = 1e-7
    expect(isSameAffine(AXIAL, noisy)).toBe(true)
    noisy[0][1] = 0.05
    expect(isSameAffine(AXIAL, noisy)).toBe(false)
  })
})
