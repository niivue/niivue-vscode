import { describe, expect, it } from 'vitest'
import {
  buildImageMessageBodies,
  getMetadataString,
  getNames,
  getNumberOfPoints,
  isDicomData,
  isImageType,
} from '../utility'

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

describe('buildImageMessageBodies (MHD / .raw pairing)', () => {
  // MHD is a detached format: the .mhd header's `ElementDataFile` names a
  // sibling .raw holding the voxels. This is the pure pairing brain behind the
  // probe-mhd "drop" e2e specs - exercised here with no WebGL load.
  //
  // buildImageMessageBodies only reads `file.name` and `file.arrayBuffer()`, and
  // jsdom's File does not implement arrayBuffer(), so a minimal File-like double
  // is both sufficient and clearer than polyfilling Blob.
  function fakeFile(name: string, bytes: Uint8Array): File {
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return { name, arrayBuffer: async () => buf } as unknown as File
  }
  function mhdFile(name: string, elementDataFile: string | null) {
    const header =
      'ObjectType = Image\nNDims = 3\nDimSize = 4 4 4\nElementType = MET_UCHAR\n' +
      (elementDataFile === null ? '' : `ElementDataFile = ${elementDataFile}\n`)
    return fakeFile(name, new TextEncoder().encode(header))
  }
  function binFile(name: string, bytes: number[]) {
    return fakeFile(name, new Uint8Array(bytes))
  }
  async function bytesOf(buf?: ArrayBuffer) {
    return buf ? Array.from(new Uint8Array(buf)) : undefined
  }

  it('pairs an .mhd with its .raw and drops the .raw as its own image', async () => {
    const bodies = await buildImageMessageBodies([
      mhdFile('sphere.mhd', 'sphere.raw'),
      binFile('sphere.raw', [9, 8, 7, 6]),
    ])
    expect(bodies).toHaveLength(1) // the .raw collapses into the .mhd body
    expect(bodies[0].uri).toBe('sphere.mhd')
    expect(await bytesOf(bodies[0].pairedData)).toEqual([9, 8, 7, 6])
    expect(bodies[0].loadError).toBeUndefined()
  })

  it('pairs regardless of order (the .raw listed first - the drop-reversed case)', async () => {
    const bodies = await buildImageMessageBodies([
      binFile('sphere.raw', [9, 8, 7, 6]),
      mhdFile('sphere.mhd', 'sphere.raw'),
    ])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].uri).toBe('sphere.mhd')
    expect(await bytesOf(bodies[0].pairedData)).toEqual([9, 8, 7, 6])
  })

  it('matches the paired file case-insensitively', async () => {
    const bodies = await buildImageMessageBodies([
      mhdFile('sphere.mhd', 'SPHERE.RAW'),
      binFile('sphere.raw', [1]),
    ])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].pairedData).toBeDefined()
  })

  it('strips surrounding quotes from the ElementDataFile value', async () => {
    const bodies = await buildImageMessageBodies([
      mhdFile('sphere.mhd', '"sphere.raw"'),
      binFile('sphere.raw', [1]),
    ])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].pairedData).toBeDefined()
  })

  it('uses only the basename when ElementDataFile carries a path', async () => {
    const bodies = await buildImageMessageBodies([
      mhdFile('sphere.mhd', 'data\\sub\\sphere.raw'),
      binFile('sphere.raw', [1]),
    ])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].pairedData).toBeDefined()
  })

  it('treats ElementDataFile = LOCAL as attached (no pairing, no error)', async () => {
    const bodies = await buildImageMessageBodies([mhdFile('embedded.mhd', 'LOCAL')])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].pairedData).toBeUndefined()
    expect(bodies[0].loadError).toBeUndefined()
  })

  it('reports a loadError when the referenced .raw is absent (the unpaired case)', async () => {
    const bodies = await buildImageMessageBodies([mhdFile('sphere.mhd', 'sphere.raw')])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].pairedData).toBeUndefined()
    expect(bodies[0].loadError).toMatch(/missing paired data file/i)
    expect(bodies[0].loadError).toContain('sphere.raw')
  })

  it('deduplicates a .raw shared by two .mhd files', async () => {
    const bodies = await buildImageMessageBodies([
      mhdFile('a.mhd', 'shared.raw'),
      mhdFile('b.mhd', 'shared.raw'),
      binFile('shared.raw', [5, 5]),
    ])
    expect(bodies.map((b) => b.uri).sort()).toEqual(['a.mhd', 'b.mhd'])
    expect(bodies.every((b) => b.pairedData)).toBe(true)
    expect(await bytesOf(bodies[0].pairedData)).toEqual([5, 5])
  })

  it('passes a non-MHD image through untouched', async () => {
    const bodies = await buildImageMessageBodies([binFile('scan.nii.gz', [1, 2, 3])])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].uri).toBe('scan.nii.gz')
    expect(bodies[0].pairedData).toBeUndefined()
    expect(await bytesOf(bodies[0].data)).toEqual([1, 2, 3])
  })
})
