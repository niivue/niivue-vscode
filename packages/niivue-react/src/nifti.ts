/**
 * Guard against opening NIfTI volumes that are too large for a browser/WebGL
 * viewer to display.
 *
 * A single JS `ArrayBuffer`/typed array - and the 3D texture NiiVue uploads
 * from it - is capped at ~2 GiB in browser engines. A volume whose
 * *uncompressed* voxel data exceeds that fails with "Array buffer allocation
 * failed" in the VS Code webview, or renders as garbage with `blur`/`sobel`
 * shader errors on some GPUs / the online viewer. Rather than read the whole
 * (possibly multi-GB) file and then fail slowly or paint a blank canvas, we
 * read just the NIfTI header - inflating only the first chunk for `.nii.gz` -
 * compute the uncompressed voxel byte length, and surface an upfront warning.
 *
 * See https://github.com/niivue/niivue-vscode/issues/228.
 */

// 2 GiB: the practical ceiling for a single ArrayBuffer / WebGL texture upload.
// Matches the empirical boundary reported in #228 (1.9 GB loads, > 2 GB fails).
export const MAX_VOLUME_BYTES = 2 * 1024 * 1024 * 1024

// NIfTI-1 headers are 348 bytes, NIfTI-2 are 540; read a little extra to be safe.
const NIFTI_HEADER_BYTES = 544

// How many leading bytes of a file to inspect. For `.nii` only the header is
// needed; for `.nii.gz` this much *compressed* input inflates to far more than
// one header (the first DecompressionStream chunk alone is ~16 KB), so it is
// always enough without reading the whole file.
export const NIFTI_PEEK_BYTES = 64 * 1024

/** True for a NIfTI volume filename, plain or gzipped. */
export function isNiftiName(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.nii') || lower.endsWith('.nii.gz')
}

function toUint8(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data)
}

/**
 * Parse a NIfTI-1 (`sizeof_hdr` 348) or NIfTI-2 (540) header and return the
 * uncompressed voxel-data byte length: `product(dim[1..dim[0]]) * bitpix / 8`.
 * Endianness is detected from `sizeof_hdr`. Returns null when the bytes are not
 * a NIfTI header we recognize or are too short to parse - callers then fall
 * through to a normal load so any genuine error still surfaces.
 */
export function niftiVoxelByteLength(header: ArrayBuffer | Uint8Array): number | null {
  const bytes = toUint8(header)
  if (bytes.byteLength < 4) {
    return null
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  // sizeof_hdr (offset 0) reads as 348 (NIfTI-1) or 540 (NIfTI-2) in the file's
  // own endianness; try little-endian first, then big-endian.
  let littleEndian = true
  let sizeofHdr = dv.getInt32(0, true)
  if (sizeofHdr !== 348 && sizeofHdr !== 540) {
    littleEndian = false
    sizeofHdr = dv.getInt32(0, false)
  }

  if (sizeofHdr === 348) {
    // NIfTI-1: dim[8] is int16 at offset 40, bitpix int16 at offset 72.
    if (bytes.byteLength < 348) {
      return null
    }
    const ndim = dv.getInt16(40, littleEndian)
    if (ndim < 1 || ndim > 7) {
      return null
    }
    const bitpix = dv.getInt16(72, littleEndian)
    if (bitpix <= 0) {
      return null
    }
    let nvox = 1
    for (let i = 1; i <= ndim; i++) {
      const d = dv.getInt16(40 + i * 2, littleEndian)
      if (d <= 0) {
        return null
      }
      nvox *= d
    }
    return nvox * (bitpix / 8)
  }

  if (sizeofHdr === 540) {
    // NIfTI-2: bitpix int16 at offset 14, dim[8] is int64 at offset 16.
    if (bytes.byteLength < 540) {
      return null
    }
    const bitpix = dv.getInt16(14, littleEndian)
    if (bitpix <= 0) {
      return null
    }
    const ndim = Number(dv.getBigInt64(16, littleEndian))
    if (ndim < 1 || ndim > 7) {
      return null
    }
    let nvox = 1
    for (let i = 1; i <= ndim; i++) {
      const d = Number(dv.getBigInt64(16 + i * 8, littleEndian))
      if (d <= 0) {
        return null
      }
      nvox *= d
    }
    return nvox * (bitpix / 8)
  }

  return null
}

/**
 * Inflate just the leading bytes of a gzip stream - enough to read a NIfTI
 * header. Accepts a (possibly truncated) prefix of the compressed data:
 * `DecompressionStream` still emits the decompressed prefix before any
 * truncation error, which we swallow. Returns null when the data is not gzip or
 * the platform lacks `DecompressionStream`.
 */
export async function inflateGzipHeader(
  compressed: ArrayBuffer | Uint8Array,
  maxBytes = NIFTI_HEADER_BYTES,
): Promise<Uint8Array | null> {
  const bytes = toUint8(compressed)
  // gzip magic bytes 0x1f 0x8b
  if (bytes.byteLength < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    return null
  }
  if (typeof DecompressionStream === 'undefined') {
    return null
  }
  // Copy the prefix into a fresh ArrayBuffer-backed view: bounds the work to at
  // most NIFTI_PEEK_BYTES and gives WritableStream a concrete BufferSource type.
  const prefix = new Uint8Array(
    bytes.byteLength > NIFTI_PEEK_BYTES ? bytes.subarray(0, NIFTI_PEEK_BYTES) : bytes,
  )
  let ds: DecompressionStream
  try {
    ds = new DecompressionStream('gzip')
  } catch {
    return null
  }
  // Feed the prefix directly through the transform's writer/reader rather than
  // Blob.stream(), which some environments (jsdom under tests) don't implement.
  // Errors from a deliberately truncated prefix are swallowed; we only want the
  // leading decompressed bytes.
  const writer = ds.writable.getWriter()
  writer.write(prefix).catch(() => {})
  writer.close().catch(() => {})
  const reader = ds.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (total < maxBytes) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      if (value) {
        chunks.push(value)
        total += value.byteLength
      }
    }
  } catch {
    // A truncated prefix throws once its compressed input is exhausted; the
    // bytes already read are valid and normally include the whole header.
  } finally {
    reader.cancel().catch(() => {})
  }
  if (total === 0) {
    return null
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

/** Human-readable, actionable warning for an oversized volume. */
export function volumeTooLargeMessage(name: string, voxelBytes: number): string {
  const basename = name.replace(/\\/g, '/').split('/').pop() || name
  const sizeGiB = (voxelBytes / 1024 ** 3).toFixed(1)
  return (
    `"${basename}" is too large to display. Its uncompressed image data is about ` +
    `${sizeGiB} GB, above the 2 GB a browser/WebGL viewer can hold for a single ` +
    `volume. Downsample or crop it first (e.g. with mri_convert, fslmaths, or ` +
    `nibabel) and open the smaller volume.`
  )
}

/**
 * Decide whether a NIfTI volume is too large to display, from only its leading
 * bytes. `leadingBytes` must hold at least the NIfTI header for a plain `.nii`,
 * or enough of the gzip stream to inflate the header for a `.nii.gz` (the first
 * {@link NIFTI_PEEK_BYTES} are ample). Returns a user-facing warning string
 * when the uncompressed voxel data exceeds {@link MAX_VOLUME_BYTES}, otherwise
 * null - also null when the file is not NIfTI or the size cannot be determined,
 * so loading proceeds and any real error still surfaces.
 */
export async function niftiTooLargeWarning(
  leadingBytes: ArrayBuffer | Uint8Array,
  name: string,
): Promise<string | null> {
  if (!isNiftiName(name)) {
    return null
  }
  const header = name.toLowerCase().endsWith('.gz')
    ? await inflateGzipHeader(leadingBytes)
    : toUint8(leadingBytes)
  if (!header) {
    return null
  }
  const voxelBytes = niftiVoxelByteLength(header)
  if (voxelBytes === null) {
    return null
  }
  return voxelBytes > MAX_VOLUME_BYTES ? volumeTooLargeMessage(name, voxelBytes) : null
}
