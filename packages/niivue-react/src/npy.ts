/**
 * NumPy `.npy` / `.npz` support for the viewer (issue #90).
 *
 * NiiVue can read `.npy`/`.npz`, but its reader only understands a fixed set of
 * element types: `b1, i1, u1, i2, u2, i4, u4, f4, f8`. NumPy's *default* integer
 * dtype is int64 (`<i8`) - `np.save('x.npy', np.arange(...))`, label maps, masks
 * and most integer arrays land here - which the reader cannot handle. On the
 * released 0.68.x line that int64 was silently mis-read as 1-byte float32
 * (garbage / all-black); on niivue v1 it throws "Unsupported NPY dtype". Either
 * way the volume never displays. See https://github.com/niivue/niivue-vscode/issues/90.
 *
 * These converters are registered with `nv.useLoader(..., 'npy'|'npz', 'npy')`
 * (the same hook used for the MINC loader). They run before NiiVue's reader and
 * down-cast the element types it can't take to ones it can:
 *   - int64  -> int32   (or float64 if any value overflows the int32 range)
 *   - uint64 -> uint32  (or float64 if any value overflows the uint32 range)
 * Int32 is preferred over float64 so the data keeps integer semantics (label-map
 * auto-detection, integer colour scales). Element types NiiVue already supports
 * are passed through untouched; genuinely undisplayable ones (complex, float16)
 * raise a clear, actionable error instead of rendering black.
 */

/** Element-type suffixes (dtype string minus its byte-order prefix) NiiVue reads natively. */
const NIIVUE_SUPPORTED_SUFFIXES = new Set([
  'b1',
  'i1',
  'u1',
  'i2',
  'u2',
  'i4',
  'u4',
  'f4',
  'f8',
])

const INT32_MIN = -2147483648n
const INT32_MAX = 2147483647n
const UINT32_MAX = 4294967295n

/** True for a NumPy filename (`.npy` or `.npz`). */
export function isNpyName(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.npy') || lower.endsWith('.npz')
}

interface NpyHeader {
  /** Byte offset where the raw array data begins. */
  dataOffset: number
  /** Full dtype string, e.g. `<i8`. */
  descr: string
  /** Byte-order prefix: `<`, `>`, `=` or `|`. */
  endian: string
  /** dtype without the byte-order prefix, e.g. `i8`. */
  suffix: string
  /** Whether the values are little-endian in the file. */
  littleEndian: boolean
  /** `fortran_order` flag, preserved verbatim into a rewritten header. */
  fortranOrder: boolean
  /** Raw text inside the `shape` tuple, e.g. `10, 12, 14` (preserved verbatim). */
  shapeInner: string
  /** Total number of elements (product of the shape dims). */
  numElements: number
}

const SYSTEM_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1
const NPY_MAGIC = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59] // \x93NUMPY

/** Copy a (possibly offset) view into a fresh, exactly-sized ArrayBuffer. */
function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data
  }
  return data.slice().buffer
}

/** Parse an `.npy` header (versions 1.0, 2.0 and 3.0). */
function parseNpyHeader(buffer: ArrayBuffer): NpyHeader {
  const bytes = new Uint8Array(buffer)
  const dv = new DataView(buffer)
  if (bytes.length < 10 || !NPY_MAGIC.every((b, i) => bytes[i] === b)) {
    throw new Error('Not a valid .npy file (magic number mismatch).')
  }
  const major = bytes[6]
  let headerLen: number
  let headerTextOffset: number
  let encoding: string
  if (major === 1) {
    headerLen = dv.getUint16(8, true)
    headerTextOffset = 10
    encoding = 'latin1'
  } else if (major === 2 || major === 3) {
    headerLen = dv.getUint32(8, true)
    headerTextOffset = 12
    encoding = major === 3 ? 'utf-8' : 'latin1'
  } else {
    throw new Error(`Unsupported .npy version ${major}.`)
  }
  const dataOffset = headerTextOffset + headerLen
  if (dataOffset > buffer.byteLength) {
    throw new Error('Corrupt .npy file (header length exceeds file size).')
  }
  const header = new TextDecoder(encoding).decode(bytes.subarray(headerTextOffset, dataOffset))

  const descrMatch = header.match(/'descr'\s*:\s*'([^']+)'/)
  if (!descrMatch) {
    throw new Error('Corrupt .npy header (no dtype).')
  }
  const descr = descrMatch[1]
  const endian = descr[0]
  const suffix = descr.slice(1)

  const shapeMatch = header.match(/'shape'\s*:\s*\(([^)]*)\)/)
  if (!shapeMatch) {
    throw new Error('Corrupt .npy header (no shape).')
  }
  const shapeInner = shapeMatch[1]
  const dims = shapeInner
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number)
  if (dims.some((d) => !Number.isInteger(d) || d < 0)) {
    throw new Error(`Corrupt .npy header (invalid shape (${shapeInner})).`)
  }
  const numElements = dims.reduce((a, b) => a * b, 1)

  const fortranOrder = /'fortran_order'\s*:\s*True/.test(header)

  // For multi-byte types `=` means native order; single-byte `|` is irrelevant.
  const littleEndian =
    endian === '<' || endian === '|' || (endian === '=' && SYSTEM_LITTLE_ENDIAN)

  return { dataOffset, descr, endian, suffix, littleEndian, fortranOrder, shapeInner, numElements }
}

/** Assemble a v1.0 `.npy` file from a dtype string, preserved header fields and raw data. */
function buildNpy(
  descr: string,
  fortranOrder: boolean,
  shapeInner: string,
  data: Uint8Array,
): ArrayBuffer {
  let dict = `{'descr': '${descr}', 'fortran_order': ${
    fortranOrder ? 'True' : 'False'
  }, 'shape': (${shapeInner}), }`
  // The 10-byte preamble + header text + trailing newline must be a multiple of
  // 64 bytes (NumPy's alignment rule); pad the dict with spaces to suit.
  const pad = (64 - ((10 + dict.length + 1) % 64)) % 64
  dict = dict + ' '.repeat(pad) + '\n'
  const headerBytes = new TextEncoder().encode(dict)

  const out = new Uint8Array(10 + headerBytes.length + data.byteLength)
  out.set(NPY_MAGIC, 0)
  out[6] = 1 // major version
  out[7] = 0 // minor version
  new DataView(out.buffer).setUint16(8, headerBytes.length, true)
  out.set(headerBytes, 10)
  out.set(data, 10 + headerBytes.length)
  return out.buffer
}

/** Down-cast an int64 array to int32 (or float64 if any value overflows int32). */
function downcastInt64(dv: DataView, dataOffset: number, n: number, littleEndian: boolean) {
  let fitsInt32 = true
  for (let i = 0; i < n; i++) {
    const v = dv.getBigInt64(dataOffset + i * 8, littleEndian)
    if (v < INT32_MIN || v > INT32_MAX) {
      fitsInt32 = false
      break
    }
  }
  if (fitsInt32) {
    const out = new Uint8Array(n * 4)
    const odv = new DataView(out.buffer)
    for (let i = 0; i < n; i++) {
      odv.setInt32(i * 4, Number(dv.getBigInt64(dataOffset + i * 8, littleEndian)), true)
    }
    return { descr: '<i4', data: out }
  }
  const out = new Uint8Array(n * 8)
  const odv = new DataView(out.buffer)
  for (let i = 0; i < n; i++) {
    odv.setFloat64(i * 8, Number(dv.getBigInt64(dataOffset + i * 8, littleEndian)), true)
  }
  return { descr: '<f8', data: out }
}

/** Down-cast a uint64 array to uint32 (or float64 if any value overflows uint32). */
function downcastUint64(dv: DataView, dataOffset: number, n: number, littleEndian: boolean) {
  let fitsUint32 = true
  for (let i = 0; i < n; i++) {
    if (dv.getBigUint64(dataOffset + i * 8, littleEndian) > UINT32_MAX) {
      fitsUint32 = false
      break
    }
  }
  if (fitsUint32) {
    const out = new Uint8Array(n * 4)
    const odv = new DataView(out.buffer)
    for (let i = 0; i < n; i++) {
      odv.setUint32(i * 4, Number(dv.getBigUint64(dataOffset + i * 8, littleEndian)), true)
    }
    return { descr: '<u4', data: out }
  }
  const out = new Uint8Array(n * 8)
  const odv = new DataView(out.buffer)
  for (let i = 0; i < n; i++) {
    odv.setFloat64(i * 8, Number(dv.getBigUint64(dataOffset + i * 8, littleEndian)), true)
  }
  return { descr: '<f8', data: out }
}

/**
 * Convert an `.npy` buffer into one NiiVue's reader can display. Buffers already
 * using a supported element type are returned unchanged; int64/uint64 are
 * down-cast; anything else (complex, float16, ...) throws an actionable error.
 */
export function convertNpy(buffer: ArrayBuffer): ArrayBuffer {
  const header = parseNpyHeader(buffer)
  if (NIIVUE_SUPPORTED_SUFFIXES.has(header.suffix)) {
    return buffer
  }

  const dv = new DataView(buffer)
  let converted: { descr: string; data: Uint8Array }
  if (header.suffix === 'i8') {
    converted = downcastInt64(dv, header.dataOffset, header.numElements, header.littleEndian)
  } else if (header.suffix === 'u8') {
    converted = downcastUint64(dv, header.dataOffset, header.numElements, header.littleEndian)
  } else {
    throw new Error(
      `This .npy uses dtype "${header.descr}", which the viewer cannot display. ` +
        `Re-save it as an 8/16/32-bit integer or 32/64-bit float array ` +
        `(e.g. arr.astype('int32') or arr.astype('float32')) before loading.`,
    )
  }

  return buildNpy(converted.descr, header.fortranOrder, header.shapeInner, converted.data)
}

/** Inflate a raw DEFLATE stream (ZIP method 8) via `DecompressionStream`. */
async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This environment cannot decompress .npz files (no DecompressionStream).')
  }
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  // Hand the compressed bytes straight to the writer/reader rather than via
  // Blob.stream(), which some test environments (jsdom) do not implement. Copy
  // into a fresh ArrayBuffer-backed view so the BufferSource type is concrete.
  writer.write(new Uint8Array(compressed)).catch(() => {})
  writer.close().catch(() => {})
  const reader = ds.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }
    if (value) {
      chunks.push(value)
      total += value.byteLength
    }
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

const ZIP_LOCAL_FILE_HEADER = 0x04034b50

/**
 * Convert an `.npz` buffer into a single displayable `.npy`. An `.npz` is a ZIP
 * archive of one or more `.npy` members (`np.savez` stores them, `savez_compressed`
 * deflates them); the first `.npy` member is extracted and run through
 * {@link convertNpy}. ZIP local-file headers are walked directly - numpy writes
 * the member sizes inline, so no central-directory pass is needed.
 */
export async function convertNpz(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buffer)
  const dv = new DataView(buffer)
  let offset = 0
  while (offset + 30 <= bytes.length) {
    if (dv.getUint32(offset, true) !== ZIP_LOCAL_FILE_HEADER) {
      break // reached the central directory (or end of archive)
    }
    const flags = dv.getUint16(offset + 6, true)
    const method = dv.getUint16(offset + 8, true)
    const compressedSize = dv.getUint32(offset + 18, true)
    const nameLen = dv.getUint16(offset + 26, true)
    const extraLen = dv.getUint16(offset + 28, true)
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLen))
    const dataStart = offset + 30 + nameLen + extraLen

    if (flags & 0x08 && compressedSize === 0) {
      // Streaming entry: the size lives in a trailing data descriptor, not the
      // local header. numpy never writes these; bail with a clear message.
      throw new Error('This .npz uses streaming ZIP entries the viewer cannot read; re-save with numpy.')
    }

    if (name.toLowerCase().endsWith('.npy')) {
      const compressed = bytes.subarray(dataStart, dataStart + compressedSize)
      let npy: Uint8Array
      if (method === 0) {
        npy = compressed
      } else if (method === 8) {
        npy = await inflateRaw(compressed)
      } else {
        throw new Error(`This .npz entry "${name}" uses unsupported ZIP compression method ${method}.`)
      }
      return convertNpy(toArrayBuffer(npy))
    }

    offset = dataStart + compressedSize
  }
  throw new Error('This .npz archive contains no .npy arrays.')
}
