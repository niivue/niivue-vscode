import { describe, expect, it } from 'vitest'
import { indentJsonNvd, looksLikeJsonNvd, normalizeJsonNvd } from '../nvd-json'

/**
 * GL-free tests for the JSON form of `.nvd` documents: what NiiVue's JSON
 * reader receives for a hand-authored or older document, and the indented
 * export. Loading such documents into a real NiiVue is covered by the PWA e2e
 * (Document.spec.ts).
 */

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))
const decode = (bytes: Uint8Array) => JSON.parse(new TextDecoder().decode(bytes))
const b64 = (nums: number[]) => Buffer.from(nums).toString('base64')

describe('normalizeJsonNvd', () => {
  it('adds the fields NiiVue requires to a sparse hand-authored scene', () => {
    const doc = decode(
      normalizeJsonNvd(encode({ volumes: [{ url: 'brain.nii.gz', colormap: 'gray' }] })),
    )

    expect(doc).toEqual({
      volumes: [{ url: 'brain.nii.gz', colormap: 'gray' }],
      version: 1,
      scene: {},
      layout: {},
      clipPlanes: [],
      meshes: [],
    })
  })

  it('keeps the fields a document sets', () => {
    const doc = decode(
      normalizeJsonNvd(encode({ version: 8, scene: { azimuth: 42 }, clipPlanes: [1, 2] })),
    )

    expect(doc.version).toBe(8)
    expect(doc.scene).toEqual({ azimuth: 42 })
    expect(doc.clipPlanes).toEqual([1, 2])
  })

  it("rewrites { $bin } byte tags as NiiVue's Uint8Array tags", () => {
    const doc = decode(
      normalizeJsonNvd(
        encode({ volumes: [{ name: 'e', data: { img: { $bin: b64([0, 1, 254, 255]) } } }] }),
      ),
    )

    expect(doc.volumes[0].data.img).toEqual({ $ta: 'Uint8Array', b64: b64([0, 1, 254, 255]) })
  })

  it('returns a complete document in NiiVue form unchanged', () => {
    const bytes = encode({
      version: 8,
      scene: {},
      layout: {},
      clipPlanes: [],
      volumes: [{ data: { $ta: 'Float32Array', b64: b64([0, 0, 128, 63]) } }],
      meshes: [],
    })

    expect(normalizeJsonNvd(bytes)).toBe(bytes)
  })

  it('drops a UTF-8 byte order mark, which NiiVue does not skip', () => {
    const complete = encode({
      version: 1,
      scene: {},
      layout: {},
      clipPlanes: [],
      volumes: [],
      meshes: [],
    })

    const out = normalizeJsonNvd(new Uint8Array([0xef, 0xbb, 0xbf, ...complete]))

    expect(out[0]).toBe('{'.charCodeAt(0))
    expect(decode(out)).toEqual(decode(complete))
  })

  it('resolves relative image links against the URL the document came from', () => {
    const doc = decode(
      normalizeJsonNvd(
        encode({
          volumes: [
            { url: 'brain.nii.gz' },
            { url: '/atlas/mni.nii.gz' },
            { url: 'https://other.example/x.nii.gz' },
            { url: 'data:application/octet-stream;base64,AA==' },
          ],
          meshes: [{ url: 'surf/lh.pial', layers: [{ url: 'lh.curv' }] }],
        }),
        'https://data.example/study/scene.nvd.json',
      ),
    )

    expect(doc.volumes.map((v: { url: string }) => v.url)).toEqual([
      'https://data.example/study/brain.nii.gz',
      'https://data.example/atlas/mni.nii.gz',
      'https://other.example/x.nii.gz',
      'data:application/octet-stream;base64,AA==',
    ])
    expect(doc.meshes[0].url).toBe('https://data.example/study/surf/lh.pial')
    expect(doc.meshes[0].layers[0].url).toBe('https://data.example/study/lh.curv')
  })

  it('keeps links it cannot resolve against an opaque document URL', () => {
    const scene = encode({
      volumes: [{ url: 'brain.nii.gz', data: { img: { $ta: 'Uint8Array', b64: b64([1]) } } }],
    })

    for (const base of ['blob:https://data.example/5b1c', 'data:application/json,{}']) {
      expect(decode(normalizeJsonNvd(scene, base)).volumes[0].url).toBe('brain.nii.gz')
    }
  })

  it('leaves links alone without the URL a document came from', () => {
    const doc = decode(normalizeJsonNvd(encode({ volumes: [{ url: 'brain.nii.gz' }] })))

    expect(doc.volumes[0].url).toBe('brain.nii.gz')
  })

  it('rejects JSON that is not an object', () => {
    expect(() => normalizeJsonNvd(encode([1, 2]))).toThrow('must be an object')
  })
})

describe('indentJsonNvd', () => {
  it('indents NiiVue JSON without changing its content', () => {
    const doc = {
      version: 8,
      scene: { azimuth: 1 },
      volumes: [{ img: { $ta: 'Uint8Array', b64: b64([9]) } }],
    }

    const out = new TextDecoder().decode(indentJsonNvd(encode(doc)))

    expect(out).toBe(JSON.stringify(doc, null, 2))
  })
})

describe('looksLikeJsonNvd', () => {
  it('sniffs JSON vs CBOR (tolerating BOM and leading whitespace)', () => {
    expect(looksLikeJsonNvd(new TextEncoder().encode('  {"a":1}'))).toBe(true)
    expect(looksLikeJsonNvd(new TextEncoder().encode('[1]'))).toBe(true)
    expect(looksLikeJsonNvd(new Uint8Array([0xef, 0xbb, 0xbf, 0x7b]))).toBe(true) // BOM + {
    expect(looksLikeJsonNvd(new Uint8Array([0xa1, 0x61, 0x61, 0x01]))).toBe(false) // CBOR map {a: 1}
  })
})
