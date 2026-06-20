import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  inflateGzipHeader,
  isNiftiName,
  MAX_VOLUME_BYTES,
  niftiTooLargeWarning,
  niftiVoxelByteLength,
  volumeTooLargeMessage,
} from '../nifti'

// --- header builders -------------------------------------------------------
// Minimal NIfTI headers carrying only the fields our size guard reads
// (sizeof_hdr, dim[], bitpix). Enough to exercise the parser without a real
// volume body.

function makeNifti1(dims: number[], bitpix: number, littleEndian = true): Uint8Array {
  const buf = new Uint8Array(352)
  const dv = new DataView(buf.buffer)
  dv.setInt32(0, 348, littleEndian) // sizeof_hdr
  dv.setInt16(40, dims[0], littleEndian) // dim[0] = number of dimensions
  for (let i = 1; i <= dims[0]; i++) {
    dv.setInt16(40 + i * 2, dims[i], littleEndian)
  }
  dv.setInt16(72, bitpix, littleEndian)
  buf.set([0x6e, 0x2b, 0x31, 0x00], 344) // magic "n+1\0"
  return buf
}

function makeNifti2(dims: number[], bitpix: number, littleEndian = true): Uint8Array {
  const buf = new Uint8Array(544)
  const dv = new DataView(buf.buffer)
  dv.setInt32(0, 540, littleEndian) // sizeof_hdr
  dv.setInt16(14, bitpix, littleEndian) // bitpix
  dv.setBigInt64(16, BigInt(dims[0]), littleEndian) // dim[0]
  for (let i = 1; i <= dims[0]; i++) {
    dv.setBigInt64(16 + i * 8, BigInt(dims[i]), littleEndian)
  }
  buf.set([0x6e, 0x2b, 0x32, 0x00], 4) // magic "n+2\0"
  return buf
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(gzipSync(Buffer.from(bytes)))
}

// A 3.65 GiB volume: 1400 x 1400 x 1000 int16 = 3,920,000,000 bytes.
const HUGE_DIMS = [3, 1400, 1400, 1000]
const HUGE_BITPIX = 16
// A real small volume (matches the repo's lesion.nii.gz fixture): 2.65 MiB.
const SMALL_DIMS = [3, 124, 160, 140]
const SMALL_BITPIX = 8

describe('isNiftiName', () => {
  it('matches .nii and .nii.gz case-insensitively', () => {
    expect(isNiftiName('brain.nii')).toBe(true)
    expect(isNiftiName('brain.NII.GZ')).toBe(true)
    expect(isNiftiName('/a/b/c.nii.gz')).toBe(true)
  })
  it('rejects non-NIfTI names', () => {
    expect(isNiftiName('mesh.gii')).toBe(false)
    expect(isNiftiName('scan.dcm')).toBe(false)
    expect(isNiftiName('image.mgz')).toBe(false)
  })
})

describe('niftiVoxelByteLength', () => {
  it('computes voxel bytes from a NIfTI-1 header (little-endian)', () => {
    expect(niftiVoxelByteLength(makeNifti1(SMALL_DIMS, SMALL_BITPIX))).toBe(124 * 160 * 140)
    expect(niftiVoxelByteLength(makeNifti1(HUGE_DIMS, HUGE_BITPIX))).toBe(3_920_000_000)
  })

  it('honours big-endian headers', () => {
    expect(niftiVoxelByteLength(makeNifti1(SMALL_DIMS, SMALL_BITPIX, false))).toBe(124 * 160 * 140)
  })

  it('parses NIfTI-2 (int64 dims) headers', () => {
    expect(niftiVoxelByteLength(makeNifti2([4, 52, 68, 20, 10], 16))).toBe(52 * 68 * 20 * 10 * 2)
    expect(niftiVoxelByteLength(makeNifti2(HUGE_DIMS, HUGE_BITPIX))).toBe(3_920_000_000)
  })

  it('returns null for non-NIfTI or too-short bytes', () => {
    expect(niftiVoxelByteLength(new Uint8Array([1, 2, 3]))).toBeNull()
    const notNifti = new Uint8Array(400)
    new DataView(notNifti.buffer).setInt32(0, 12345, true)
    expect(niftiVoxelByteLength(notNifti)).toBeNull()
  })

  it('returns null when a dimension is non-positive (malformed header)', () => {
    expect(niftiVoxelByteLength(makeNifti1([3, 124, 0, 140], 8))).toBeNull()
  })
})

describe('inflateGzipHeader', () => {
  it('inflates a gzip stream enough to read the header', async () => {
    const header = makeNifti1(SMALL_DIMS, SMALL_BITPIX)
    const inflated = await inflateGzipHeader(await gzip(header))
    expect(inflated).not.toBeNull()
    expect(niftiVoxelByteLength(inflated!)).toBe(124 * 160 * 140)
  })

  it('recovers the header from only a truncated gzip prefix', async () => {
    // Header + several MB of body, gzipped, then sliced to a small prefix:
    // the decompressor still emits the leading bytes before the stream ends.
    const big = new Uint8Array(4 * 1024 * 1024)
    big.set(makeNifti1(SMALL_DIMS, SMALL_BITPIX))
    for (let i = 352; i < big.length; i++) big[i] = i & 0xff
    const gz = await gzip(big)
    const prefix = gz.subarray(0, 4096)
    const inflated = await inflateGzipHeader(prefix)
    expect(inflated).not.toBeNull()
    expect(niftiVoxelByteLength(inflated!)).toBe(124 * 160 * 140)
  })

  it('returns null for non-gzip input', async () => {
    expect(await inflateGzipHeader(makeNifti1(SMALL_DIMS, SMALL_BITPIX))).toBeNull()
  })
})

describe('niftiTooLargeWarning', () => {
  it('warns for an oversized plain .nii (from header only)', async () => {
    const warning = await niftiTooLargeWarning(makeNifti1(HUGE_DIMS, HUGE_BITPIX), 'huge.nii')
    expect(warning).toMatch(/too large to display/i)
    expect(warning).toContain('huge.nii')
    expect(warning).toContain('3.7 GB')
  })

  it('warns for an oversized .nii.gz by inflating the header', async () => {
    const gz = await gzip(makeNifti1(HUGE_DIMS, HUGE_BITPIX))
    const warning = await niftiTooLargeWarning(gz, 'huge.nii.gz')
    expect(warning).toMatch(/too large to display/i)
    expect(warning).toContain('huge.nii.gz')
  })

  it('allows a normal-sized .nii', async () => {
    expect(await niftiTooLargeWarning(makeNifti1(SMALL_DIMS, SMALL_BITPIX), 'ok.nii')).toBeNull()
  })

  it('allows a normal-sized .nii.gz', async () => {
    const gz = await gzip(makeNifti1(SMALL_DIMS, SMALL_BITPIX))
    expect(await niftiTooLargeWarning(gz, 'ok.nii.gz')).toBeNull()
  })

  it('does not block non-NIfTI files or undecodable headers', async () => {
    expect(await niftiTooLargeWarning(makeNifti1(HUGE_DIMS, HUGE_BITPIX), 'mesh.gii')).toBeNull()
    expect(await niftiTooLargeWarning(new Uint8Array([1, 2, 3]), 'broken.nii')).toBeNull()
  })

  it('uses 2 GiB as the boundary', () => {
    expect(MAX_VOLUME_BYTES).toBe(2 * 1024 * 1024 * 1024)
    // Exactly at the limit is allowed; one voxel over is not (checked via message helper).
    expect(volumeTooLargeMessage('x.nii', MAX_VOLUME_BYTES + 1)).toContain('2.0 GB')
  })
})
