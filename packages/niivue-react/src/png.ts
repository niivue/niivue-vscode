/**
 * Adds `tEXt` metadata chunks to an encoded PNG. Canvas encoders cannot write
 * metadata themselves, so the chunks are spliced into their output.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

let crcTable: Uint32Array | null = null

/** CRC-32 as used by PNG chunks (ISO 3309, reflected polynomial 0xEDB88320). */
export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function latin1Bytes(text: string): number[] {
  return Array.from(text, (char) => {
    const code = char.charCodeAt(0)
    // tEXt is Latin-1 and uses a null byte as the keyword separator.
    if (code === 0 || code > 0xff) {
      throw new RangeError(`PNG text must be Latin-1 without null bytes: ${JSON.stringify(text)}`)
    }
    return code
  })
}

function textChunk(keyword: string, text: string): Uint8Array {
  if (keyword.length < 1 || keyword.length > 79) {
    throw new RangeError(`PNG text keyword must be 1-79 characters: ${JSON.stringify(keyword)}`)
  }
  const data = [...latin1Bytes(keyword), 0, ...latin1Bytes(text)]
  const chunk = new Uint8Array(12 + data.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.length)
  chunk.set([0x74, 0x45, 0x58, 0x74], 4) // "tEXt"
  chunk.set(data, 8)
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))
  return chunk
}

/**
 * Return a copy of `png` with one `tEXt` chunk per entry, placed right after
 * IHDR so readers find the metadata before the image data.
 */
export function addPngTextChunks(
  png: Uint8Array,
  entries: Record<string, string>,
): Uint8Array<ArrayBuffer> {
  const isPng =
    png.length >= 33 &&
    PNG_SIGNATURE.every((byte, i) => png[i] === byte) &&
    String.fromCharCode(...png.subarray(12, 16)) === 'IHDR'
  const ihdrLength = isPng ? new DataView(png.buffer, png.byteOffset).getUint32(8) : 0
  const insertAt = PNG_SIGNATURE.length + 12 + ihdrLength
  if (!isPng || insertAt > png.length) {
    throw new Error('Not a PNG image')
  }
  const chunks = Object.entries(entries).map(([keyword, text]) => textChunk(keyword, text))

  const out = new Uint8Array(png.length + chunks.reduce((total, c) => total + c.length, 0))
  out.set(png.subarray(0, insertAt))
  let offset = insertAt
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  out.set(png.subarray(insertAt), offset)
  return out
}
