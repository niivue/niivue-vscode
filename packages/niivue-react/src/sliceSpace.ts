import type { NVImage } from '@niivue/niivue'
import type { ExtendedNiivue } from './events'

/**
 * Voxel-space vs world-space slice rendering.
 *
 * niivue 0.x exposed `opts.isSliceMM`: `false` (its default) drew 2D slices on
 * the native voxel grid, `true` drew them in scanner/world mm space, which
 * rotates and resamples an obliquely acquired volume. @niivue/niivue 1.0 dropped
 * the option and always renders in world space: its 2D model-view-projection is
 * built from `volumes[0].obliqueRAS`, which is only the identity for an
 * axis-aligned volume.
 *
 * Voxel space comes back through niivue's public affine API. Replacing a
 * volume's affine with its nearest axis-aligned equivalent makes `calculateRAS`
 * derive an identity `obliqueRAS`, so slices land on the voxel grid again. The
 * orthogonalization keeps every voxel axis' dominant direction, sign and length,
 * so niivue's RAS permutation (and the texture layout it drives) is unchanged;
 * only the shear/rotation is dropped.
 *
 * Everything is derived from `volume.originalAffine`, the affine as loaded, which
 * niivue stores once and never mutates. That makes the switch idempotent, and
 * `resetVolumeAffine` restores world space exactly.
 *
 * Limitations, both shared with niivue 0.x's voxel-space mode: meshes are not
 * moved onto the voxel grid with the volumes, and the mm readout becomes
 * voxel-grid mm rather than scanner mm.
 */

/** Row-major 4x4 matrix, matching niivue's `AffineMatrix` shape. */
export type Affine = number[][]

/** Off-grid tolerance in mm per voxel; below this an affine counts as aligned. */
const ALIGNED_TOLERANCE = 1e-4

/** Row-major 4x4 multiply, `a * b`. */
export function multiplyAffine(a: Affine, b: Affine): Affine {
  const out: Affine = []
  for (let r = 0; r < 4; r++) {
    out.push([0, 1, 2, 3].map((c) => a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c] + a[r][3] * b[3][c]))
  }
  return out
}

/** Inverse of a 4x4 affine (bottom row [0,0,0,1]); null when the 3x3 is singular. */
export function invertAffine(m: Affine): Affine | null {
  const [a, b, c] = m[0]
  const [d, e, f] = m[1]
  const [g, h, i] = m[2]
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
  if (!Number.isFinite(det) || det === 0) {
    return null
  }
  const inv3 = [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ]
  const t = [m[0][3], m[1][3], m[2][3]]
  const out: Affine = inv3.map((row) => [
    ...row,
    -(row[0] * t[0] + row[1] * t[1] + row[2] * t[2]),
  ])
  out.push([0, 0, 0, 1])
  return out
}

/** True when two affines agree to within the off-grid tolerance. */
export function isSameAffine(a: Affine, b: Affine, tolerance = ALIGNED_TOLERANCE): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (Math.abs(a[r][c] - b[r][c]) > tolerance) {
        return false
      }
    }
  }
  return true
}

/**
 * Nearest axis-aligned affine: every voxel axis keeps the RAS direction, sign and
 * length it had, the shear is dropped, and the world origin stays on the same
 * voxel so the crosshair does not jump. Null for a degenerate affine.
 */
export function orthogonalizeAffine(affine: Affine): Affine | null {
  const abs = (r: number, c: number) => Math.abs(affine[r][c])

  // Which RAS row does each voxel column point along? This mirrors niivue's own
  // dominant-axis pick in calculateRAS - strongest row for column 0, strongest
  // of the two remaining rows for column 1, leftover row for column 2 - so the
  // permRAS it derives from our affine matches the one it derived from the
  // original, and the voxel data is not re-permuted or mirrored.
  let r0 = 0
  if (abs(1, 0) > abs(0, 0)) r0 = 1
  if (abs(2, 0) > abs(0, 0) && abs(2, 0) > abs(1, 0)) r0 = 2
  let r1: number
  if (r0 === 0) r1 = abs(1, 1) > abs(2, 1) ? 1 : 2
  else if (r0 === 1) r1 = abs(0, 1) > abs(2, 1) ? 0 : 2
  else r1 = abs(0, 1) > abs(1, 1) ? 0 : 1
  const rowForColumn = [r0, r1, 3 - r0 - r1]

  const out: Affine = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1],
  ]
  for (let col = 0; col < 3; col++) {
    const row = rowForColumn[col]
    const length = Math.hypot(affine[0][col], affine[1][col], affine[2][col])
    if (!(length > 0) || abs(row, col) === 0) {
      return null
    }
    out[row][col] = affine[row][col] < 0 ? -length : length
  }

  // Keep the world origin on the voxel it already sits on: t = -A' * p, where p
  // is the voxel index the original affine maps to (0,0,0) mm.
  const inverse = invertAffine(affine)
  if (!inverse) {
    return null
  }
  const p = [inverse[0][3], inverse[1][3], inverse[2][3]]
  for (let row = 0; row < 3; row++) {
    out[row][3] = -(out[row][0] * p[0] + out[row][1] * p[1] + out[row][2] * p[2])
  }
  return out
}

/**
 * The transform that moves a whole canvas from world space onto the background
 * volume's voxel grid: `orthogonalize(A0) * inverse(A0)`. Applying the *same*
 * correction to every volume keeps overlays registered to the background instead
 * of letting each one drift onto its own grid.
 *
 * Null when the background is already axis-aligned (voxel space is then
 * identical to world space, so the affines are left untouched) or degenerate.
 */
export function voxelSpaceCorrection(background: NVImage | undefined): Affine | null {
  const original = background?.originalAffine
  if (!original) {
    return null
  }
  const ortho = orthogonalizeAffine(original)
  if (!ortho || isSameAffine(ortho, original)) {
    return null
  }
  const inverse = invertAffine(original)
  return inverse ? multiplyAffine(ortho, inverse) : null
}

// Volumes currently switched to voxel space. Keyed on the volume object so the
// bookkeeping survives reordering, and so a volume loaded while voxel space is
// already active can be brought into line without re-applying the rest.
const inVoxelSpace = new WeakSet<NVImage>()

/**
 * Bring every canvas to the requested slice space. Safe to call repeatedly: each
 * volume is only touched when its space actually has to change.
 */
export async function applySliceSpace(
  nvArray: ExtendedNiivue[],
  worldSpace: boolean,
): Promise<void> {
  for (const nv of nvArray) {
    const volumes: NVImage[] = nv?.volumes ?? []
    if (volumes.length === 0) {
      continue
    }
    const correction = worldSpace ? null : voxelSpaceCorrection(volumes[0])
    for (let i = 0; i < volumes.length; i++) {
      const volume = volumes[i]
      try {
        if (worldSpace) {
          if (!inVoxelSpace.has(volume)) continue
          await nv.resetVolumeAffine(i)
          inVoxelSpace.delete(volume)
        } else {
          if (!correction || inVoxelSpace.has(volume) || !volume.originalAffine) continue
          await nv.setVolumeAffine(i, multiplyAffine(correction, volume.originalAffine))
          inVoxelSpace.add(volume)
        }
      } catch (e) {
        console.warn(`Failed to switch volume ${i} to ${worldSpace ? 'world' : 'voxel'} space`, e)
      }
    }
  }
}
