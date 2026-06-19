import { Encoder, decode } from 'cbor-x'
import { describe, expect, it } from 'vitest'
import { cborNvdToJson, jsonNvdToCbor, looksLikeJsonNvd } from '../nvd-json'

/**
 * GL-free tests for the JSON <-> CBOR `.nvd` transcoder. These guard that a
 * JSON scene authored in an editor produces the exact CBOR `nv.loadDocument`
 * expects, and that the inverse export is readable JSON - without a WebGL
 * context or a live niivue instance.
 */

// Same encoder niivue's `decode` consumes (plain CBOR, no record extension).
const enc = new Encoder({ useRecords: false })
const b64 = (nums: number[]) => Buffer.from(nums).toString('base64')

describe('nvd-json transcode', () => {
  it('a URL-only JSON scene transcodes to CBOR and fills niivue-required defaults', () => {
    const cbor = jsonNvdToCbor(JSON.stringify({ volumes: [{ url: 'brain.nii.gz', colormap: 'gray' }] }))
    const doc = decode(cbor) as any
    expect(doc.volumes).toEqual([{ url: 'brain.nii.gz', colormap: 'gray' }])
    expect(doc.scene.azimuth).toBe(110) // default filled
    expect(doc.clipPlanes).toEqual([])
    expect(doc.meshes).toEqual([])
    expect(doc.version).toBe(1)
  })

  it('user scene fields override defaults; unspecified scene fields keep defaults', () => {
    const doc = decode(jsonNvdToCbor(JSON.stringify({ scene: { azimuth: 42 } }))) as any
    expect(doc.scene.azimuth).toBe(42)
    expect(doc.scene.elevation).toBe(10)
  })

  it('embedded binary round-trips via { $bin } as a real Uint8Array', () => {
    const doc = decode(
      jsonNvdToCbor(JSON.stringify({ volumes: [{ name: 'e', data: { img: { $bin: b64([0, 1, 2, 254, 255]) } } }] })),
    ) as any
    expect(doc.volumes[0].data.img).toBeInstanceOf(Uint8Array)
    expect(Array.from(doc.volumes[0].data.img)).toEqual([0, 1, 2, 254, 255])
  })

  it('cborNvdToJson is the inverse: Uint8Array becomes { $bin } and the JSON parses', () => {
    const cbor = new Uint8Array(
      enc.encode({ version: 1, scene: { azimuth: 1 }, clipPlanes: [], meshes: [], volumes: [{ name: 'v', data: { img: new Uint8Array([9, 8, 7]) } }] }),
    )
    const json = JSON.parse(cborNvdToJson(cbor))
    expect(json.volumes[0].data.img).toEqual({ $bin: b64([9, 8, 7]) })
    expect(json.scene.azimuth).toBe(1)
  })

  it('round-trips JSON -> CBOR -> JSON preserving an embedded volume and clip planes', () => {
    const original = {
      volumes: [{ url: 'a.nii.gz', colormap: 'hot', data: { img: { $bin: b64([3, 1, 4, 1, 5]) } } }],
      clipPlanes: [1, 2],
    }
    const back = JSON.parse(cborNvdToJson(jsonNvdToCbor(JSON.stringify(original))))
    expect(back.volumes[0].url).toBe('a.nii.gz')
    expect(back.volumes[0].data.img).toEqual(original.volumes[0].data.img)
    expect(back.clipPlanes).toEqual([1, 2])
  })

  it('sniffs JSON vs CBOR (tolerating BOM and leading whitespace)', () => {
    expect(looksLikeJsonNvd(new TextEncoder().encode('  {"a":1}'))).toBe(true)
    expect(looksLikeJsonNvd(new TextEncoder().encode('[1]'))).toBe(true)
    expect(looksLikeJsonNvd(new Uint8Array([0xef, 0xbb, 0xbf, 0x7b]))).toBe(true) // BOM + {
    expect(looksLikeJsonNvd(new Uint8Array(enc.encode({ a: 1 })))).toBe(false) // CBOR map
  })
})
