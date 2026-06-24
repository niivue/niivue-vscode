import NiiVue from '@niivue/niivue'
import type { NVImage, NVConnectomeOptions } from '@niivue/niivue'
import { isNiftiName, NIFTI_PEEK_BYTES, niftiTooLargeWarning } from './nifti'

// This function computes the display names for each Niivue instance in the array
// It handles duplicate names by using overlay or layer names of the last item
export function getNames(nvArray: NiiVue[]) {
  // Get base names (first volume or mesh)
  const baseNames = nvArray.map((item) => {
    if (item.volumes.length > 0) {
      return decodeURIComponent(item.volumes[0].name)
    }
    if (item.meshes.length > 0) {
      // v1: NVMesh.name is optional; fall back to '' for a freshly created mesh.
      return decodeURIComponent(item.meshes[0].name ?? '')
    }
    if ((item as any).uri) {
      return decodeURIComponent((item as any).uri)
    }
    return ''
  })

  // Check for duplicates
  const nameCount = new Map<string, number>()
  baseNames.forEach((name) => {
    nameCount.set(name, (nameCount.get(name) || 0) + 1)
  })

  // Use last overlay only for items with duplicate base names
  return nvArray.map((item, idx) => {
    const baseName = baseNames[idx]
    const hasDuplicate = nameCount.get(baseName)! > 1

    if (!hasDuplicate) {
      return baseName
    }

    // For volumes with duplicates: use last overlay if available
    if (item.volumes.length > 1) {
      return decodeURIComponent(item.volumes[item.volumes.length - 1].name)
    }
    if (item.volumes.length > 0) {
      return baseName
    }

    // For meshes with duplicates: use last layer if available
    if (item.meshes.length > 0) {
      const mesh = item.meshes[0]
      if (mesh.layers && mesh.layers.length > 0) {
        const lastLayer = mesh.layers[mesh.layers.length - 1]
        if (lastLayer.name) {
          return decodeURIComponent(lastLayer.name)
        }
      }
      return baseName
    }

    return ''
  })
}

// This function finds common patterns in the names and only returns the parts of the names that are different
export function differenceInNames(names: string[], rec = true) {
  if (names.length === 0) {
    return []
  }
  const minLen = Math.min(...names.map((name) => name.length))
  let startCommon = minLen
  outer: while (startCommon > 0) {
    const chars = names[0].slice(0, startCommon)
    for (let i = 1; i < names.length; i++) {
      if (names[i].slice(0, startCommon) !== chars) {
        startCommon -= 1
        continue outer
      }
    }
    break
  }
  // if startCommon points to a number then include all preceding numbers including "." as well
  while (
    startCommon > 0 &&
    (names[0].slice(startCommon - 1, startCommon) === '.' ||
      (names[0].slice(startCommon - 1, startCommon) >= '0' &&
        names[0].slice(startCommon - 1, startCommon) <= '9'))
  ) {
    startCommon -= 1
  }
  // if startCommon points to a letter then include all preceding letters as well
  while (
    startCommon > 0 &&
    names[0].slice(startCommon - 1, startCommon).toLowerCase() >= 'a' &&
    names[0].slice(startCommon - 1, startCommon).toLowerCase() <= 'z'
  ) {
    startCommon -= 1
  }

  let endCommon = minLen
  outer: while (endCommon > 0) {
    const chars = names[0].slice(-endCommon)
    for (let i = 1; i < names.length; i++) {
      if (names[i].slice(-endCommon) !== chars) {
        endCommon -= 1
        continue outer
      }
    }
    break
  }
  // if endCommon points to a number then include all following numbers as well
  while (
    endCommon > 0 &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) >= '0' &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) <= '9'
  ) {
    endCommon -= 1
  }
  // if endCommon points to a letter then include all following letters as well
  while (
    endCommon > 0 &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) >= 'a' &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) <= 'z'
  ) {
    endCommon -= 1
  }

  const diffNames = names.map((name) => name.slice(startCommon, name.length - endCommon))

  // If length is greater than display length, then split by folder and diff again for first folder and filename and join
  if (rec) {
    const folders = diffNames.map((name) => name.split('/').slice(0, -1).join('/'))
    const diffFolders = differenceInNames(folders, false)
    const filenames = diffNames.map((name) => name.split('/').slice(-1)[0])
    const diffFilenames = differenceInNames(filenames, false)
    diffNames.forEach((_, i) => {
      let separator = ' - '
      if (!diffFolders[i] || !diffFilenames[i]) {
        separator = ''
      }
      diffNames[i] = diffFolders[i] + separator + diffFilenames[i]
    })
  }
  return diffNames
}

// DICOM Part 10 files start with a 128-byte preamble followed by the
// magic bytes "DICM". Scanner exports often have no file extension (or a
// bare UID as the name), so content sniffing is the only reliable check.
const DICM_OFFSET = 128

export function isDicomData(data: unknown): boolean {
  let bytes: Uint8Array | number[]
  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data)
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  } else if (Array.isArray(data) && typeof data[0] === 'number') {
    // postMessage across some bridges serializes buffers to number arrays
    bytes = data
  } else {
    return false
  }
  return (
    bytes.length >= DICM_OFFSET + 4 &&
    bytes[DICM_OFFSET] === 0x44 && // D
    bytes[DICM_OFFSET + 1] === 0x49 && // I
    bytes[DICM_OFFSET + 2] === 0x43 && // C
    bytes[DICM_OFFSET + 3] === 0x4d // M
  )
}

export function isImageType(item: string) {
  return [
    '.nii',
    '.nii.gz',
    '.dcm',
    '.mha',
    '.mhd',
    '.nhdr',
    '.nrrd',
    '.mgh',
    '.mgz',
    '.npy',
    '.npz',
    '.v',
    '.v16',
    '.vmr',
    '.mnc',
    '.mnc.gz',
  ].find((fileType) => item.endsWith(fileType))
}

// ---- GraphML (vessel graph / brain network) support ----
//
// Tools such as SkelHub export vessel skeletons and brain networks as GraphML
// (an XML graph format). Each <node> carries world-space coordinates and each
// <edge> joins two nodes. We convert this to NiiVue's connectome model (the
// sparse JCON shape: a node/edge list plus display options) so the graph
// renders as spheres (nodes) joined by cylinders (edges), matching how the
// source tools preview these graphs as points and lines.

interface ConnectomeNode {
  name: string
  x: number
  y: number
  z: number
  colorValue: number
  sizeValue: number
}

interface ConnectomeEdge {
  first: number
  second: number
  colorValue: number
}

// A NiiVue connectome in the sparse JCON representation: node/edge lists plus
// the display options the mesh loader reads from the same JSON.
export type GraphmlConnectome = NVConnectomeOptions & {
  nodes: ConnectomeNode[]
  edges: ConnectomeEdge[]
}

// Direct element children of `parent` with the given local name. Used instead
// of getElementsByTagName so a nested subgraph's nodes/edges/data are not
// hoisted into the parent graph or element.
function directChildren(parent: Element, localName: string): Element[] {
  const result: Element[] = []
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i]
    if (child.nodeType === 1 && (child as Element).localName === localName) {
      result.push(child as Element)
    }
  }
  return result
}

// Read the GraphML <key> table so <data key="..."> references resolve to their
// declared attribute names (e.g. key id "v_X" -> attribute "X").
function readGraphmlKeyNames(doc: Document): Map<string, string> {
  const keyNames = new Map<string, string>()
  const keys = doc.getElementsByTagNameNS('*', 'key')
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i].getAttribute('id')
    if (!id) continue
    keyNames.set(id, keys[i].getAttribute('attr.name') ?? id)
  }
  return keyNames
}

// Collect an element's direct <data> children, keyed by resolved attribute
// name. Only direct children are read so a nested subgraph cannot leak its
// values into the parent node/edge.
function readGraphmlData(element: Element, keyNames: Map<string, string>): Record<string, string> {
  const values: Record<string, string> = {}
  for (const el of directChildren(element, 'data')) {
    const key = el.getAttribute('key')
    if (!key) continue
    values[keyNames.get(key) ?? key] = el.textContent ?? ''
  }
  return values
}

// First finite coordinate found among the candidate attribute names. An empty
// <data> value is treated as absent: Number('') is 0, which would otherwise
// place the node at the origin instead of reporting a missing coordinate.
function pickGraphmlCoordinate(
  values: Record<string, string>,
  candidates: string[],
): number | undefined {
  for (const key of candidates) {
    const raw = values[key]
    if (raw === undefined || raw.trim() === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

/**
 * Convert GraphML text into a NiiVue connectome definition. Nodes need
 * world-space coordinates under attributes `X`/`Y`/`Z` (or lowercase
 * `x`/`y`/`z`); edges reference nodes by their GraphML `source`/`target` ids.
 * Throws with a clear message when the file is not parseable GraphML, has no
 * nodes, or has nodes without coordinates.
 */
export function graphmlToConnectome(text: string): GraphmlConnectome {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Could not parse GraphML: the file is not valid XML')
  }
  const graph = doc.getElementsByTagNameNS('*', 'graph')[0]
  if (!graph) {
    throw new Error('Could not parse GraphML: no <graph> element found')
  }

  const keyNames = readGraphmlKeyNames(doc)

  const nodes: ConnectomeNode[] = []
  const idToIndex = new Map<string, number>()
  for (const el of directChildren(graph, 'node')) {
    const id = el.getAttribute('id')
    if (!id) continue
    const values = readGraphmlData(el, keyNames)
    const x = pickGraphmlCoordinate(values, ['X', 'x'])
    const y = pickGraphmlCoordinate(values, ['Y', 'y'])
    const z = pickGraphmlCoordinate(values, ['Z', 'z'])
    if (x === undefined || y === undefined || z === undefined) {
      throw new Error(
        'GraphML node is missing X/Y/Z coordinates; cannot place the graph in 3D space',
      )
    }
    idToIndex.set(id, nodes.length)
    nodes.push({ name: values.name ?? id, x, y, z, colorValue: 1, sizeValue: 1 })
  }

  if (nodes.length === 0) {
    throw new Error('GraphML contains no nodes')
  }

  const edges: ConnectomeEdge[] = []
  for (const el of directChildren(graph, 'edge')) {
    const first = idToIndex.get(el.getAttribute('source') ?? '')
    const second = idToIndex.get(el.getAttribute('target') ?? '')
    if (first === undefined || second === undefined) continue
    edges.push({ first, second, colorValue: 1 })
  }

  // Uniform color values with nodeMin==nodeMax and edgeMin==edgeMax: this keeps
  // every node and edge visible (the default connectome thresholds would hide
  // edges whose value falls below edgeMin) and gives the graph one flat color.
  return {
    nodes,
    edges,
    nodeColormap: 'warm',
    nodeColormapNegative: 'winter',
    nodeMinColor: 1,
    nodeMaxColor: 1,
    nodeScale: 2,
    edgeColormap: 'warm',
    edgeColormapNegative: 'winter',
    edgeMin: 1,
    edgeMax: 1,
    edgeScale: 1,
  }
}

/**
 * Given a list of dropped/picked Files, returns one `addImage` message body
 * per logical image. For MHD files, finds the paired `.raw` file in the
 * same list (by basename from the `ElementDataFile` header field) and
 * attaches its bytes as `pairedData`. The paired `.raw` file is removed
 * from the result so it is not loaded as a separate image.
 */
export type ImageMessageBody = {
  // Omitted for load-error bodies (e.g. an oversized volume we refuse to read).
  data?: ArrayBuffer
  uri: string
  pairedData?: ArrayBuffer
  loadError?: string
}

export async function buildImageMessageBodies(
  files: File[],
): Promise<ImageMessageBody[]> {
  const byName = new Map<string, File>()
  for (const f of files) {
    byName.set(f.name.toLowerCase(), f)
  }

  // First pass: pre-read every .mhd header so we know which .raw files are
  // claimed as paired data, regardless of iteration order. This makes the
  // result independent of which file the user grabbed when dragging.
  const pairedDataByMhd = new Map<string, ArrayBuffer>()
  const claimedAsPair = new Set<string>()
  const mhdBuffers = new Map<string, ArrayBuffer>()
  const errorByMhd = new Map<string, string>()
  // Cache raw buffers by basename so two MHDs referencing the same .raw
  // don't double-read a potentially large file into memory.
  const rawBufferCache = new Map<string, ArrayBuffer>()
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.mhd')) continue
    const data = await file.arrayBuffer()
    mhdBuffers.set(file.name.toLowerCase(), data)
    const text = new TextDecoder().decode(data)
    const match = text.match(/^ElementDataFile\s*=\s*(.+)$/im)
    const rawValue = match?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
    if (!rawValue || rawValue.toUpperCase() === 'LOCAL') continue
    const basename = rawValue.replace(/\\/g, '/').split('/').pop() ?? ''
    const basenameKey = basename.toLowerCase()
    const pairedFile = byName.get(basenameKey)
    if (!pairedFile) {
      errorByMhd.set(
        file.name.toLowerCase(),
        `Missing paired data file "${basename}". MHD is a detached format — please drop or select ${file.name} together with ${basename}.`,
      )
      continue
    }
    let pairedData = rawBufferCache.get(basenameKey)
    if (!pairedData) {
      pairedData = await pairedFile.arrayBuffer()
      rawBufferCache.set(basenameKey, pairedData)
    }
    pairedDataByMhd.set(file.name.toLowerCase(), pairedData)
    claimedAsPair.add(basenameKey)
  }

  const bodies: ImageMessageBody[] = []
  for (const file of files) {
    const key = file.name.toLowerCase()
    if (claimedAsPair.has(key)) continue
    // Refuse NIfTI volumes whose uncompressed voxel data exceeds the ~2 GB
    // ArrayBuffer/texture ceiling. Peek only the header (decompressing just the
    // gzip prefix for .nii.gz) so we never read - let alone try to allocate -
    // the whole multi-GB file. See niivue/niivue-vscode#228.
    if (isNiftiName(file.name)) {
      let tooLarge: string | null = null
      try {
        const head = await file.slice(0, NIFTI_PEEK_BYTES).arrayBuffer()
        tooLarge = await niftiTooLargeWarning(head, file.name)
      } catch {
        // Couldn't peek the header (unusual) - fall through to a normal load.
      }
      if (tooLarge) {
        bodies.push({ uri: file.name, loadError: tooLarge })
        continue
      }
    }
    const data = mhdBuffers.get(key) ?? (await file.arrayBuffer())
    const loadError = errorByMhd.get(key)
    if (loadError) {
      bodies.push({ data, uri: file.name, loadError })
    } else {
      const pairedData = pairedDataByMhd.get(key)
      if (pairedData) {
        bodies.push({ data, uri: file.name, pairedData })
      } else {
        bodies.push({ data, uri: file.name })
      }
    }
  }
  return bodies
}

export interface ImageMetadata {
  nx: number
  ny: number
  nz: number
  nt: number
  dx: number
  dy: number
  dz: number
}

/**
 * Replacement for the removed per-image metadata accessor (niivue v1). Reads the
 * matrix size and voxel dimensions straight off the NIfTI header dims/pixDims
 * (1-based, matching the old return shape: nx,ny,nz,nt and dx,dy,dz). Returns an
 * empty object when there is no header (mirrors the old undefined-when-absent).
 */
export function getImageMetadata(vol?: NVImage): ImageMetadata | Record<string, never> {
  const h = vol?.hdr
  if (!h) return {}
  return {
    nx: h.dims[1],
    ny: h.dims[2],
    nz: h.dims[3],
    nt: h.dims[4],
    dx: h.pixDims[1],
    dy: h.pixDims[2],
    dz: h.pixDims[3],
  }
}

export function getMetadataString(nv: NiiVue) {
  const meta = getImageMetadata(nv?.volumes?.[0])
  if (!('nx' in meta) || !meta.nx) {
    return ''
  }
  const matrixString = 'matrix size: ' + meta.nx + ' x ' + meta.ny + ' x ' + meta.nz
  const voxelString =
    'voxelsize: ' +
    meta.dx.toPrecision(2) +
    ' x ' +
    meta.dy.toPrecision(2) +
    ' x ' +
    meta.dz.toPrecision(2)
  const timeString = meta.nt > 1 ? ', timepoints: ' + meta.nt : ''
  return matrixString + ', ' + voxelString + timeString
}

export function getNumberOfPoints(nv: NiiVue) {
  const mesh = nv?.meshes?.[0]
  // v1: mesh geometry is `positions` (flat x,y,z Float32Array); 3 floats per point.
  const matrixString = 'Number of Points: ' + mesh.positions.length / 3
  return matrixString
}

// Reorder an array by moving an item from one index to another
export function reorderImages<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return array
  }

  const result = [...array]
  const [movedItem] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, movedItem)
  return result
}

// Swap two items in place. Used by the "swap" drop zone (middle third of a
// Volume); semantically distinct from reorderImages, which is shift-based.
export function swapImages<T>(array: T[], i: number, j: number): T[] {
  if (i === j) return array
  const result = [...array]
  ;[result[i], result[j]] = [result[j], result[i]]
  return result
}
