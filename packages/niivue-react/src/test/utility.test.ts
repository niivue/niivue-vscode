import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  buildImageMessageBodies,
  getMetadataString,
  getNames,
  getNumberOfPoints,
  graphmlToConnectome,
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
  // v1: getMetadataString reads vol.hdr.dims/pixDims via the getImageMetadata
  // helper (the per-image metadata accessor was removed). dims/pixDims are
  // 1-based: dims[1..4] = nx,ny,nz,nt and pixDims[1..3] = dx,dy,dz.
  function nv(volumes: { nx: number; ny: number; nz: number; dx: number; dy: number; dz: number; nt: number }[]) {
    return {
      volumes: volumes.map((m) => ({
        hdr: { dims: [3, m.nx, m.ny, m.nz, m.nt], pixDims: [0, m.dx, m.dy, m.dz] },
      })),
    } as any
  }

  it('returns empty string when no volume is loaded', () => {
    expect(getMetadataString({ volumes: [] } as any)).toBe('')
  })

  it('returns empty string when nv is undefined', () => {
    expect(getMetadataString(undefined as any)).toBe('')
  })

  it('returns empty string when metadata has no nx (uninitialized volume)', () => {
    const stub = { volumes: [{ hdr: undefined }] } as any
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
  // v1: mesh geometry is `positions` (flat x,y,z Float32Array), not `pts`.
  it('returns the per-vertex point count (positions.length / 3)', () => {
    const nv = { meshes: [{ positions: new Array(30) }] } as any
    expect(getNumberOfPoints(nv)).toBe('Number of Points: 10')
  })

  it('handles zero-length point arrays', () => {
    const nv = { meshes: [{ positions: [] }] } as any
    expect(getNumberOfPoints(nv)).toBe('Number of Points: 0')
  })
})

describe('graphmlToConnectome', () => {
  // Mirrors the GraphML that igraph writes (used by SkelHub): nodes carry
  // world-space X/Y/Z plus a name, edges reference nodes by their `source`/
  // `target` ids, and every <data> points at a <key> declaring its attr.name.
  const igraphGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="v_name" for="node" attr.name="name" attr.type="string"/>
  <key id="v_X" for="node" attr.name="X" attr.type="double"/>
  <key id="v_Y" for="node" attr.name="Y" attr.type="double"/>
  <key id="v_Z" for="node" attr.name="Z" attr.type="double"/>
  <key id="e_proto_edge_id" for="edge" attr.name="proto_edge_id" attr.type="double"/>
  <graph edgedefault="undirected">
    <node id="n0"><data key="v_name">a</data><data key="v_X">1</data><data key="v_Y">2</data><data key="v_Z">3</data></node>
    <node id="n1"><data key="v_name">b</data><data key="v_X">4</data><data key="v_Y">5</data><data key="v_Z">6</data></node>
    <node id="n2"><data key="v_name">c</data><data key="v_X">7</data><data key="v_Y">8</data><data key="v_Z">9</data></node>
    <edge source="n0" target="n2"><data key="e_proto_edge_id">0</data></edge>
    <edge source="n1" target="n2"><data key="e_proto_edge_id">1</data></edge>
  </graph>
</graphml>`

  it('parses nodes with world coordinates and names', () => {
    const c = graphmlToConnectome(igraphGraphml)
    expect(c.nodes).toEqual([
      { name: 'a', x: 1, y: 2, z: 3, colorValue: 1, sizeValue: 1 },
      { name: 'b', x: 4, y: 5, z: 6, colorValue: 1, sizeValue: 1 },
      { name: 'c', x: 7, y: 8, z: 9, colorValue: 1, sizeValue: 1 },
    ])
  })

  it('maps edge source/target ids to node indices (not assuming order)', () => {
    const c = graphmlToConnectome(igraphGraphml)
    // n0->n2 and n1->n2 become index pairs 0-2 and 1-2.
    expect(c.edges).toEqual([
      { first: 0, second: 2, colorValue: 1 },
      { first: 1, second: 2, colorValue: 1 },
    ])
  })

  it('keeps node and edge color ranges collapsed so nothing is thresholded away', () => {
    // The connectome renderer hides edges whose colorValue < edgeMin. Equal
    // min/max guards every node and edge against being culled.
    const c = graphmlToConnectome(igraphGraphml)
    expect(c.nodeMinColor).toBe(c.nodeMaxColor)
    expect(c.edgeMin).toBe(c.edgeMax)
  })

  it('accepts lowercase x/y/z coordinate attributes', () => {
    const lower = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="kx" for="node" attr.name="x" attr.type="double"/>
      <key id="ky" for="node" attr.name="y" attr.type="double"/>
      <key id="kz" for="node" attr.name="z" attr.type="double"/>
      <graph>
        <node id="a"><data key="kx">1.5</data><data key="ky">2.5</data><data key="kz">3.5</data></node>
      </graph>
    </graphml>`
    const c = graphmlToConnectome(lower)
    expect(c.nodes).toEqual([{ name: 'a', x: 1.5, y: 2.5, z: 3.5, colorValue: 1, sizeValue: 1 }])
  })

  it('falls back to the node id when no name attribute is present', () => {
    const noName = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="kx" for="node" attr.name="X" attr.type="double"/>
      <key id="ky" for="node" attr.name="Y" attr.type="double"/>
      <key id="kz" for="node" attr.name="Z" attr.type="double"/>
      <graph><node id="root"><data key="kx">0</data><data key="ky">0</data><data key="kz">0</data></node></graph>
    </graphml>`
    expect(graphmlToConnectome(noName).nodes[0].name).toBe('root')
  })

  it('skips edges that reference an unknown node id', () => {
    const danglingEdge = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="kx" for="node" attr.name="X" attr.type="double"/>
      <key id="ky" for="node" attr.name="Y" attr.type="double"/>
      <key id="kz" for="node" attr.name="Z" attr.type="double"/>
      <graph>
        <node id="a"><data key="kx">0</data><data key="ky">0</data><data key="kz">0</data></node>
        <node id="b"><data key="kx">1</data><data key="ky">1</data><data key="kz">1</data></node>
        <edge source="a" target="b"/>
        <edge source="a" target="missing"/>
      </graph>
    </graphml>`
    expect(graphmlToConnectome(danglingEdge).edges).toEqual([{ first: 0, second: 1, colorValue: 1 }])
  })

  it('throws when a node has no coordinates', () => {
    const noCoords = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="v_name" for="node" attr.name="name" attr.type="string"/>
      <graph><node id="n0"><data key="v_name">a</data></node></graph>
    </graphml>`
    expect(() => graphmlToConnectome(noCoords)).toThrow(/X\/Y\/Z/)
  })

  it('treats an empty coordinate value as missing rather than 0', () => {
    // Number('') is 0; without the guard this node would silently land at the
    // origin instead of reporting the missing coordinate.
    const emptyCoord = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="kx" for="node" attr.name="X" attr.type="double"/>
      <key id="ky" for="node" attr.name="Y" attr.type="double"/>
      <key id="kz" for="node" attr.name="Z" attr.type="double"/>
      <graph><node id="n0"><data key="kx"></data><data key="ky">1</data><data key="kz">2</data></node></graph>
    </graphml>`
    expect(() => graphmlToConnectome(emptyCoord)).toThrow(/X\/Y\/Z/)
  })

  it('does not hoist nodes from a nested subgraph into the top-level graph', () => {
    const nested = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
      <key id="kx" for="node" attr.name="X" attr.type="double"/>
      <key id="ky" for="node" attr.name="Y" attr.type="double"/>
      <key id="kz" for="node" attr.name="Z" attr.type="double"/>
      <graph>
        <node id="outer">
          <data key="kx">0</data><data key="ky">0</data><data key="kz">0</data>
          <graph><node id="inner"><data key="kx">9</data><data key="ky">9</data><data key="kz">9</data></node></graph>
        </node>
      </graph>
    </graphml>`
    const c = graphmlToConnectome(nested)
    expect(c.nodes).toEqual([{ name: 'outer', x: 0, y: 0, z: 0, colorValue: 1, sizeValue: 1 }])
  })

  it('throws when the graph has no nodes', () => {
    const empty = `<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph></graph></graphml>`
    expect(() => graphmlToConnectome(empty)).toThrow(/no nodes/)
  })

  it('throws on malformed XML', () => {
    expect(() => graphmlToConnectome('<graphml><graph></graphml>')).toThrow(/not valid XML/)
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
    return {
      name,
      arrayBuffer: async () => buf,
      // Minimal Blob.slice: enough for the NIfTI header peek in
      // buildImageMessageBodies (file.slice(0, N).arrayBuffer()).
      slice: (start?: number, end?: number) => ({
        arrayBuffer: async () => buf.slice(start ?? 0, end ?? buf.byteLength),
      }),
    } as unknown as File
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

describe('buildImageMessageBodies (oversized NIfTI guard)', () => {
  // A minimal NIfTI-1 header carrying only the fields the size guard reads.
  function niftiHeader(dims: number[], bitpix: number): Uint8Array {
    const buf = new Uint8Array(352)
    const dv = new DataView(buf.buffer)
    dv.setInt32(0, 348, true)
    dv.setInt16(40, dims[0], true)
    for (let i = 1; i <= dims[0]; i++) dv.setInt16(40 + i * 2, dims[i], true)
    dv.setInt16(72, bitpix, true)
    return buf
  }
  // 1400 x 1400 x 1000 int16 = 3.65 GiB of voxels: over the 2 GB ceiling.
  const HUGE = niftiHeader([3, 1400, 1400, 1000], 16)
  // A File-like double whose full read throws, so a passing test proves the
  // guard decided from the header alone and never read the whole file.
  function unreadableFile(name: string, header: Uint8Array): File {
    const buf = header.buffer.slice(header.byteOffset, header.byteOffset + header.byteLength)
    return {
      name,
      arrayBuffer: async () => {
        throw new Error('whole-file read attempted for an oversized volume')
      },
      slice: (start?: number, end?: number) => ({
        arrayBuffer: async () => buf.slice(start ?? 0, end ?? buf.byteLength),
      }),
    } as unknown as File
  }
  function readableFile(name: string, bytes: Uint8Array): File {
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return {
      name,
      arrayBuffer: async () => buf,
      slice: (start?: number, end?: number) => ({
        arrayBuffer: async () => buf.slice(start ?? 0, end ?? buf.byteLength),
      }),
    } as unknown as File
  }

  it('refuses an oversized .nii from its header without reading the whole file', async () => {
    const bodies = await buildImageMessageBodies([unreadableFile('huge.nii', HUGE)])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].uri).toBe('huge.nii')
    expect(bodies[0].loadError).toMatch(/too large to display/i)
    expect(bodies[0].data).toBeUndefined()
  })

  it('refuses an oversized .nii.gz by inflating only the header', async () => {
    const gz = new Uint8Array(gzipSync(Buffer.from(HUGE)))
    const bodies = await buildImageMessageBodies([unreadableFile('huge.nii.gz', gz)])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].loadError).toMatch(/too large to display/i)
    expect(bodies[0].data).toBeUndefined()
  })

  it('loads a normal-sized NIfTI as usual', async () => {
    const bodies = await buildImageMessageBodies([
      readableFile('ok.nii', niftiHeader([3, 124, 160, 140], 8)),
    ])
    expect(bodies).toHaveLength(1)
    expect(bodies[0].loadError).toBeUndefined()
    expect(bodies[0].data).toBeDefined()
  })
})
