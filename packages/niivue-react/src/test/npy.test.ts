import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { convertNpy, convertNpz, isNpyName } from '../npy'

// --- .npy builders / readers ----------------------------------------------
// Build minimal but spec-correct v1.0 .npy buffers and read them back, so the
// tests exercise the real header parser without depending on Python fixtures.

const MAGIC = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]

function makeNpy(descr: string, shapeInner: string, data: Uint8Array): ArrayBuffer {
  let dict = `{'descr': '${descr}', 'fortran_order': False, 'shape': (${shapeInner}), }`
  const pad = (64 - ((10 + dict.length + 1) % 64)) % 64
  dict = dict + ' '.repeat(pad) + '\n'
  const headerBytes = new TextEncoder().encode(dict)
  const out = new Uint8Array(10 + headerBytes.length + data.byteLength)
  out.set(MAGIC, 0)
  out[6] = 1
  out[7] = 0
  new DataView(out.buffer).setUint16(8, headerBytes.length, true)
  out.set(headerBytes, 10)
  out.set(data, 10 + headerBytes.length)
  return out.buffer
}

function readNpy(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const dv = new DataView(buffer)
  const headerLen = dv.getUint16(8, true)
  const header = new TextDecoder('latin1').decode(bytes.subarray(10, 10 + headerLen))
  const descr = header.match(/'descr'\s*:\s*'([^']+)'/)![1]
  const shapeInner = header.match(/'shape'\s*:\s*\(([^)]*)\)/)![1]
  const suffix = descr.slice(1)
  const le = descr[0] !== '>'
  const dataOffset = 10 + headerLen
  const dims = shapeInner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
  const n = dims.reduce((a, b) => a * b, 1)
  const values: number[] = []
  for (let i = 0; i < n; i++) {
    switch (suffix) {
      case 'i4':
        values.push(dv.getInt32(dataOffset + i * 4, le))
        break
      case 'u4':
        values.push(dv.getUint32(dataOffset + i * 4, le))
        break
      case 'f8':
        values.push(dv.getFloat64(dataOffset + i * 8, le))
        break
      case 'u1':
        values.push(dv.getUint8(dataOffset + i))
        break
      default:
        throw new Error(`test reader: unhandled dtype ${descr}`)
    }
  }
  return { descr, shapeInner, values }
}

function bytesOf(arr: { buffer: ArrayBufferLike; byteOffset: number; byteLength: number }): Uint8Array {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
}

// --- .npz (ZIP) builder ----------------------------------------------------
// One local file header + member data is all convertNpz needs (it returns at
// the first .npy member); a trailing central-directory signature terminates the
// scan cleanly.

function makeNpz(entryName: string, npy: Uint8Array, method: 0 | 8): ArrayBuffer {
  const data = method === 8 ? new Uint8Array(deflateRawSync(npy)) : npy
  const nameBytes = new TextEncoder().encode(entryName)
  const header = new Uint8Array(30 + nameBytes.length)
  const dv = new DataView(header.buffer)
  dv.setUint32(0, 0x04034b50, true) // local file header signature
  dv.setUint16(4, 20, true) // version needed
  dv.setUint16(6, 0, true) // flags
  dv.setUint16(8, method, true) // compression method
  dv.setUint32(14, 0, true) // crc-32 (not validated by the reader)
  dv.setUint32(18, data.length, true) // compressed size
  dv.setUint32(22, npy.length, true) // uncompressed size
  dv.setUint16(26, nameBytes.length, true)
  dv.setUint16(28, 0, true) // extra length
  header.set(nameBytes, 30)
  const out = new Uint8Array(header.length + data.length + 4)
  out.set(header, 0)
  out.set(data, header.length)
  out.set([0x50, 0x4b, 0x01, 0x02], header.length + data.length) // central-dir sentinel
  return out.buffer
}

describe('isNpyName', () => {
  it('matches .npy and .npz case-insensitively', () => {
    expect(isNpyName('volume.npy')).toBe(true)
    expect(isNpyName('VOLUME.NPZ')).toBe(true)
    expect(isNpyName('brain.nii.gz')).toBe(false)
  })
})

describe('convertNpy - supported dtypes pass through untouched', () => {
  it('returns the same buffer for float64', () => {
    const buf = makeNpy('<f8', '2, 3', bytesOf(new Float64Array([0, 1, 2, 3, 4, 5])))
    expect(convertNpy(buf)).toBe(buf)
  })

  it('returns the same buffer for uint8 and int32', () => {
    const u8 = makeNpy('|u1', '2, 2', new Uint8Array([1, 2, 3, 4]))
    const i4 = makeNpy('<i4', '2, 2', bytesOf(new Int32Array([1, 2, 3, 4])))
    expect(convertNpy(u8)).toBe(u8)
    expect(convertNpy(i4)).toBe(i4)
  })
})

describe('convertNpy - int64 (numpy default integer dtype)', () => {
  it('down-casts int64 to int32 when values fit, preserving data and shape', () => {
    const src = new BigInt64Array([0n, 1n, -7n, 1679n])
    const out = convertNpy(makeNpy('<i8', '2, 2', bytesOf(src)))
    const r = readNpy(out)
    expect(r.descr).toBe('<i4')
    expect(r.shapeInner).toBe('2, 2')
    expect(r.values).toEqual([0, 1, -7, 1679])
  })

  it('falls back to float64 when a value overflows int32', () => {
    const src = new BigInt64Array([0n, 3000000000n]) // > 2^31 - 1
    const out = convertNpy(makeNpy('<i8', '1, 2', bytesOf(src)))
    const r = readNpy(out)
    expect(r.descr).toBe('<f8')
    expect(r.values).toEqual([0, 3000000000])
  })
})

describe('convertNpy - uint64', () => {
  it('down-casts uint64 to uint32 when values fit', () => {
    const src = new BigUint64Array([0n, 5n, 4294967295n])
    const out = convertNpy(makeNpy('<u8', '1, 3', bytesOf(src)))
    const r = readNpy(out)
    expect(r.descr).toBe('<u4')
    expect(r.values).toEqual([0, 5, 4294967295])
  })

  it('falls back to float64 when a value overflows uint32', () => {
    const src = new BigUint64Array([0n, 5000000000n]) // > 2^32 - 1
    const out = convertNpy(makeNpy('<u8', '1, 2', bytesOf(src)))
    const r = readNpy(out)
    expect(r.descr).toBe('<f8')
    expect(r.values).toEqual([0, 5000000000])
  })
})

describe('convertNpy - undisplayable dtypes', () => {
  it('throws an actionable error for complex data', () => {
    const buf = makeNpy('<c16', '2', new Uint8Array(32))
    expect(() => convertNpy(buf)).toThrow(/cannot display/i)
  })

  it('throws on a non-npy buffer', () => {
    expect(() => convertNpy(new Uint8Array([1, 2, 3, 4]).buffer)).toThrow(/not a valid \.npy/i)
  })
})

describe('convertNpz', () => {
  it('extracts and converts a stored (uncompressed) int64 member', async () => {
    const npy = new Uint8Array(makeNpy('<i8', '2, 2', bytesOf(new BigInt64Array([1n, 2n, 3n, 4n]))))
    const out = await convertNpz(makeNpz('arr_0.npy', npy, 0))
    const r = readNpy(out)
    expect(r.descr).toBe('<i4')
    expect(r.values).toEqual([1, 2, 3, 4])
  })

  it('inflates and converts a deflate-compressed member', async () => {
    const npy = new Uint8Array(makeNpy('<i8', '1, 3', bytesOf(new BigInt64Array([10n, 20n, 30n]))))
    const out = await convertNpz(makeNpz('data.npy', npy, 8))
    const r = readNpy(out)
    expect(r.descr).toBe('<i4')
    expect(r.values).toEqual([10, 20, 30])
  })

  it('throws when the archive has no .npy member', async () => {
    const notNpy = new Uint8Array([1, 2, 3, 4])
    await expect(convertNpz(makeNpz('readme.txt', notNpy, 0))).rejects.toThrow(/no \.npy/i)
  })
})
