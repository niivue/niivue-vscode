import { describe, expect, it } from 'vitest'
import { getMetadataString, getNames, getNumberOfPoints, isDicomData, isImageType } from '../utility'

describe('isImageType', () => {
  // The function returns the matched extension string when supported, or
  // `undefined` otherwise. Assert the exact return value, not just truthiness,
  // so a regression that detects "yes it's an image" but returns the wrong
  // extension would still fail.
  it.each([
    ['scan.nii', '.nii'],
    ['scan.nii.gz', '.nii.gz'],
    ['data.dcm', '.dcm'],
    ['image.mha', '.mha'],
    ['image.mhd', '.mhd'],
    ['image.nhdr', '.nhdr'],
    ['image.nrrd', '.nrrd'],
    ['image.mgh', '.mgh'],
    ['image.mgz', '.mgz'],
    ['image.npy', '.npy'],
    ['image.npz', '.npz'],
    ['image.v', '.v'],
    ['image.v16', '.v16'],
    ['image.vmr', '.vmr'],
    ['image.mnc', '.mnc'],
    ['image.mnc.gz', '.mnc.gz'],
  ])('given %s, returns %s', (name, expected) => {
    expect(isImageType(name)).toBe(expected)
  })

  it('returns undefined for unsupported types', () => {
    expect(isImageType('scan.png')).toBeUndefined()
    expect(isImageType('readme.md')).toBeUndefined()
    expect(isImageType('plain')).toBeUndefined()
  })

  it('matches case-sensitively (matches src behavior — extensions are lowercase)', () => {
    expect(isImageType('scan.NII.GZ')).toBeUndefined()
    expect(isImageType('scan.nii.gz')).toBe('.nii.gz')
  })

  it('preserves preceding path components — only inspects the suffix', () => {
    expect(isImageType('/some/path/scan.nii.gz')).toBe('.nii.gz')
    expect(isImageType('http://host/img.nrrd')).toBe('.nrrd')
  })
})

describe('isDicomData', () => {
  // DICOM Part 10: 128-byte preamble, then the magic bytes "DICM". Files
  // exported by scanners often have no extension, so this content sniff is
  // what routes them to the DICOM loader.
  function dicomBytes(extra = 8): Uint8Array {
    const bytes = new Uint8Array(128 + 4 + extra)
    bytes.set([0x44, 0x49, 0x43, 0x4d], 128) // "DICM"
    return bytes
  }

  it('detects the DICM magic in an ArrayBuffer', () => {
    expect(isDicomData(dicomBytes().buffer)).toBe(true)
  })

  it('detects the DICM magic in a Uint8Array view with a byte offset', () => {
    const padded = new Uint8Array(16 + 140)
    padded.set(dicomBytes(), 16)
    const view = new Uint8Array(padded.buffer, 16, 140)
    expect(isDicomData(view)).toBe(true)
  })

  it('detects the DICM magic in a plain number array (postMessage-serialized)', () => {
    expect(isDicomData(Array.from(dicomBytes()))).toBe(true)
  })

  it('rejects buffers shorter than preamble + magic', () => {
    expect(isDicomData(new ArrayBuffer(131))).toBe(false)
    expect(isDicomData(new ArrayBuffer(0))).toBe(false)
  })

  it('rejects data with "DICM" at the wrong offset', () => {
    const bytes = new Uint8Array(140)
    bytes.set([0x44, 0x49, 0x43, 0x4d], 0)
    expect(isDicomData(bytes.buffer)).toBe(false)
  })

  it('rejects non-DICOM binary data of sufficient length', () => {
    const bytes = new Uint8Array(200).fill(0xff)
    expect(isDicomData(bytes.buffer)).toBe(false)
  })

  it('rejects non-binary inputs', () => {
    expect(isDicomData(undefined)).toBe(false)
    expect(isDicomData(null)).toBe(false)
    expect(isDicomData('DICM')).toBe(false)
    expect(isDicomData([new ArrayBuffer(140)])).toBe(false) // array of buffers (folder payload)
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
