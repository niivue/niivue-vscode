import { crc32 as zlibCrc32, deflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { addPngTextChunks, crc32 } from '../png'

type Chunk = { type: string; data: Uint8Array; crc: number }

// Build a real 1x1 RGBA PNG, with CRCs from zlib so the writer is checked
// against an independent implementation.
function makePng(): Uint8Array {
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length)
    const view = new DataView(out.buffer)
    view.setUint32(0, data.length)
    out.set(Buffer.from(type, 'latin1'), 4)
    out.set(data, 8)
    view.setUint32(8 + data.length, zlibCrc32(out.subarray(4, 8 + data.length)))
    return out
  }
  const ihdr = new Uint8Array(13)
  new DataView(ihdr.buffer).setUint32(0, 1) // width
  new DataView(ihdr.buffer).setUint32(4, 1) // height
  ihdr.set([8, 6, 0, 0, 0], 8) // 8-bit RGBA, deflate, adaptive filter, no interlace
  const idat = deflateSync(Uint8Array.from([0, 255, 0, 0, 255]))
  return Uint8Array.from(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', idat),
      chunk('IEND', new Uint8Array(0)),
    ]),
  )
}

function parseChunks(png: Uint8Array): Chunk[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const chunks: Chunk[] = []
  let offset = 8
  while (offset < png.length) {
    const length = view.getUint32(offset)
    const type = Buffer.from(png.subarray(offset + 4, offset + 8)).toString('latin1')
    const data = png.subarray(offset + 8, offset + 8 + length)
    chunks.push({ type, data, crc: view.getUint32(offset + 8 + length) })
    offset += 12 + length
  }
  return chunks
}

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array(0))).toBe(0)
  })

  it('agrees with zlib on arbitrary bytes', () => {
    const bytes = Uint8Array.from({ length: 1000 }, (_, i) => (i * 131 + 7) % 256)
    expect(crc32(bytes)).toBe(zlibCrc32(bytes))
  })
})

describe('addPngTextChunks', () => {
  it('inserts tEXt chunks with valid CRCs right after IHDR, keeping the image intact', () => {
    const png = makePng()
    const out = addPngTextChunks(png, { Software: 'niivue Viewer', Comment: 'Please cite: x' })

    expect(Array.from(out.subarray(0, 8))).toEqual(Array.from(png.subarray(0, 8)))
    const chunks = parseChunks(out)
    expect(chunks.map((c) => c.type)).toEqual(['IHDR', 'tEXt', 'tEXt', 'IDAT', 'IEND'])
    for (const chunk of chunks) {
      const typeAndData = Buffer.concat([Buffer.from(chunk.type, 'latin1'), chunk.data])
      expect(chunk.crc).toBe(zlibCrc32(typeAndData))
    }
    const texts = chunks
      .filter((c) => c.type === 'tEXt')
      .map((c) => Buffer.from(c.data).toString('latin1'))
    expect(texts).toEqual(['Software\0niivue Viewer', 'Comment\0Please cite: x'])

    const original = parseChunks(png)
    const kept = chunks.filter((c) => c.type !== 'tEXt')
    expect(kept.map((c) => Array.from(c.data))).toEqual(original.map((c) => Array.from(c.data)))
    expect(out.length).toBe(png.length + texts.reduce((n, t) => n + 12 + t.length, 0))
  })

  it('does not modify the input', () => {
    const png = makePng()
    const copy = png.slice()
    addPngTextChunks(png, { Comment: 'x' })
    expect(png).toEqual(copy)
  })

  it('rejects data that is not a PNG', () => {
    expect(() => addPngTextChunks(new Uint8Array(64), { Comment: 'x' })).toThrow('Not a PNG')
    expect(() => addPngTextChunks(makePng().subarray(0, 20), { Comment: 'x' })).toThrow('Not a PNG')
  })

  it('rejects keywords and text that tEXt cannot hold', () => {
    const png = makePng()
    expect(() => addPngTextChunks(png, { '': 'x' })).toThrow(RangeError)
    expect(() => addPngTextChunks(png, { ['k'.repeat(80)]: 'x' })).toThrow(RangeError)
    expect(() => addPngTextChunks(png, { Comment: 'a\0b' })).toThrow(RangeError)
    expect(() => addPngTextChunks(png, { Comment: '100 €' })).toThrow(RangeError)
  })

  it('writes Latin-1 text byte for byte', () => {
    const out = addPngTextChunks(makePng(), { Comment: 'Zürich' })
    const text = parseChunks(out).find((c) => c.type === 'tEXt')!
    expect(Array.from(text.data)).toEqual([...Buffer.from('Comment\0Zürich', 'latin1')])
  })
})
