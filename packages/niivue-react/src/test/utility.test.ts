import { describe, expect, it } from 'vitest'
import { getMetadataString, getNames, getNumberOfPoints, isImageType } from '../utility'

describe('isImageType', () => {
  it.each([
    'scan.nii',
    'scan.nii.gz',
    'data.dcm',
    'image.mha',
    'image.mhd',
    'image.nhdr',
    'image.nrrd',
    'image.mgh',
    'image.mgz',
    'image.npy',
    'image.npz',
    'image.v',
    'image.v16',
    'image.vmr',
    'image.mnc',
    'image.mnc.gz',
  ])('returns the matched extension for %s', (name) => {
    expect(isImageType(name)).toBeTruthy()
  })

  it('returns undefined for unsupported types', () => {
    expect(isImageType('scan.png')).toBeUndefined()
    expect(isImageType('readme.md')).toBeUndefined()
    expect(isImageType('plain')).toBeUndefined()
  })

  it('matches case-sensitively (matches src behavior — extensions are lowercase)', () => {
    expect(isImageType('scan.NII.GZ')).toBeUndefined()
    expect(isImageType('scan.nii.gz')).toBeTruthy()
  })

  it('preserves preceding path components — only inspects the suffix', () => {
    expect(isImageType('/some/path/scan.nii.gz')).toBe('.nii.gz')
    expect(isImageType('http://host/img.nrrd')).toBe('.nrrd')
  })
})

describe('getMetadataString', () => {
  function nv(volumes: { nx: number; ny: number; nz: number; dx: number; dy: number; dz: number; nt: number }[]) {
    return {
      volumes: volumes.map((meta) => ({ getImageMetadata: () => meta })),
    } as any
  }

  it('returns empty string when no volume is loaded', () => {
    expect(getMetadataString({ volumes: [] } as any)).toBe('')
  })

  it('returns empty string when nv is undefined', () => {
    expect(getMetadataString(undefined as any)).toBe('')
  })

  it('returns empty string when metadata has no nx (uninitialized volume)', () => {
    const stub = { volumes: [{ getImageMetadata: () => ({}) }] } as any
    expect(getMetadataString(stub)).toBe('')
  })

  it('formats matrix and voxel size for a 3D image', () => {
    const s = getMetadataString(nv([{ nx: 192, ny: 256, nz: 256, dx: 1, dy: 1, dz: 1, nt: 1 }]))
    expect(s).toBe('matrix size: 192 x 256 x 256, voxelsize: 1.0 x 1.0 x 1.0')
  })

  it('appends timepoints for a 4D image', () => {
    const s = getMetadataString(nv([{ nx: 64, ny: 64, nz: 36, dx: 3, dy: 3, dz: 3, nt: 120 }]))
    expect(s).toContain('matrix size: 64 x 64 x 36')
    expect(s).toContain('voxelsize: 3.0 x 3.0 x 3.0')
    expect(s).toContain('timepoints: 120')
  })

  it('uses precision-2 formatting for sub-mm voxels', () => {
    const s = getMetadataString(nv([{ nx: 1, ny: 1, nz: 1, dx: 0.7, dy: 0.7, dz: 0.7, nt: 1 }]))
    expect(s).toContain('voxelsize: 0.70 x 0.70 x 0.70')
  })
})

describe('getNumberOfPoints', () => {
  it('returns the per-vertex point count (pts.length / 3)', () => {
    const nv = { meshes: [{ pts: new Array(30) }] } as any
    expect(getNumberOfPoints(nv)).toBe('Number of Points: 10')
  })

  it('handles zero-length point arrays', () => {
    const nv = { meshes: [{ pts: [] }] } as any
    expect(getNumberOfPoints(nv)).toBe('Number of Points: 0')
  })
})

describe('getNames', () => {
  // The source treats each `item` as a Niivue instance with `volumes` and `meshes` arrays.
  // We synthesize the minimum shape that getNames inspects.
  const makeVol = (name: string) => ({ name })
  const makeMesh = (name: string, layers: { name: string }[] = []) => ({ name, layers })
  const makeNv = (volumes: { name: string }[] = [], meshes: ReturnType<typeof makeMesh>[] = []) =>
    ({ volumes, meshes } as any)

  it('returns base volume name for unique volumes', () => {
    const nv1 = makeNv([makeVol('subject01.nii.gz')])
    const nv2 = makeNv([makeVol('subject02.nii.gz')])
    expect(getNames([nv1, nv2])).toEqual(['subject01.nii.gz', 'subject02.nii.gz'])
  })

  it('returns base mesh name when no volumes are present', () => {
    const nv = makeNv([], [makeMesh('cortex.gii')])
    expect(getNames([nv])).toEqual(['cortex.gii'])
  })

  it('returns empty string when neither volumes nor meshes are present', () => {
    const nv = makeNv()
    expect(getNames([nv])).toEqual([''])
  })

  it('decodes URI-encoded names', () => {
    const nv = makeNv([makeVol('my%20scan.nii.gz')])
    expect(getNames([nv])).toEqual(['my scan.nii.gz'])
  })

  it('on duplicate volume names, uses last overlay name to disambiguate', () => {
    const nv1 = makeNv([makeVol('subj.nii.gz')])
    const nv2 = makeNv([makeVol('subj.nii.gz'), makeVol('lesion-overlay.nii.gz')])
    expect(getNames([nv1, nv2])).toEqual(['subj.nii.gz', 'lesion-overlay.nii.gz'])
  })

  it('on duplicate mesh names with layers, uses last layer name', () => {
    const nv1 = makeNv([], [makeMesh('cortex.gii')])
    const nv2 = makeNv([], [makeMesh('cortex.gii', [{ name: 'thickness.gii' }, { name: 'curv.gii' }])])
    expect(getNames([nv1, nv2])).toEqual(['cortex.gii', 'curv.gii'])
  })

  it('falls back to mesh base name when duplicate mesh has no layers', () => {
    const nv1 = makeNv([], [makeMesh('cortex.gii')])
    const nv2 = makeNv([], [makeMesh('cortex.gii')])
    // Both kept as the base name because there's no overlay to disambiguate.
    expect(getNames([nv1, nv2])).toEqual(['cortex.gii', 'cortex.gii'])
  })

  it('falls back to uri when neither volumes nor meshes exist', () => {
    const nv = { volumes: [], meshes: [], uri: 'http://example.org/scan.nii' } as any
    expect(getNames([nv])).toEqual(['http://example.org/scan.nii'])
  })
})
