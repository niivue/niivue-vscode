import { Niivue } from '@niivue/niivue'
import { isNiftiName, NIFTI_PEEK_BYTES, niftiTooLargeWarning } from './nifti'

// This function computes the display names for each Niivue instance in the array
// It handles duplicate names by using overlay or layer names of the last item
export function getNames(nvArray: Niivue[]) {
  // Get base names (first volume or mesh)
  const baseNames = nvArray.map((item) => {
    if (item.volumes.length > 0) {
      return decodeURIComponent(item.volumes[0].name)
    }
    if (item.meshes.length > 0) {
      return decodeURIComponent(item.meshes[0].name)
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

export function getMetadataString(nv: Niivue) {
  const meta = nv?.volumes?.[0]?.getImageMetadata()
  if (!meta || !meta.nx) {
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

export function getNumberOfPoints(nv: Niivue) {
  const mesh = nv?.meshes?.[0]
  const matrixString = 'Number of Points: ' + mesh.pts.length / 3
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
