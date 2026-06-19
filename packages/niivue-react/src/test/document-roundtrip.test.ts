import { describe, expect, it } from 'vitest'
import { isNvdFile, parseNvd, readNvdFile } from '../document'

/**
 * Phase 0 of the Viewer-Host Protocol work: pin the scene contract. niivue v1.0
 * removed the old JSON document API; the `.nvd` payload is now the opaque CBOR
 * byte blob from `nv.serializeDocument()`, loaded via `nv.loadDocument(File)`.
 * Producing those bytes needs a live (GL) niivue instance, so this golden no
 * longer runs at the document-data layer.
 *
 * Instead it guards the GL-free seam we own: `document.ts`, which moves the
 * `.nvd` bytes between disk/download and `nv.loadDocument`. We assert that
 * wrapping the bytes in a `.nvd` File and reading them back is byte-identical -
 * the round-trip the import path (`addImagesEvent` -> `readNvdFile` -> a File for
 * `nv.loadDocument`) and the export path (`nv.serializeDocument` -> `downloadNvd`)
 * both depend on. The full renderer round-trip (drop -> import -> export) is
 * covered by the PWA Playwright E2E, which has a real WebGL/WebGPU context.
 */

// Stand-in for the CBOR `.nvd` bytes serializeDocument() would emit. The exact
// contents are opaque to us; what matters is that the seam preserves them. We
// return an ArrayBuffer so it is an unambiguous BlobPart for `new File([...])`.
function fakeNvdBuffer(): ArrayBuffer {
  const bytes = new Uint8Array(256)
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7 + 3) & 0xff
  return bytes.buffer
}

// jsdom's File/Blob does not implement arrayBuffer(), so use a minimal Blob-like
// double exposing just the surface readNvdFile/parseNvd consume (same pattern as
// utility.test.ts's buildImageMessageBodies tests).
function fakeNvdFile(buffer: ArrayBuffer): Blob {
  return { arrayBuffer: async () => buffer } as unknown as Blob
}

describe('document.ts .nvd byte round-trip (Phase 0 golden, GL-free)', () => {
  it('recognizes .nvd filenames case-insensitively', () => {
    expect(isNvdFile('scene.nvd')).toBe(true)
    expect(isNvdFile('SCENE.NVD')).toBe(true)
    expect(isNvdFile('brain.nii.gz')).toBe(false)
  })

  it('parseNvd returns the raw bytes unchanged (niivue decodes CBOR internally)', () => {
    const buffer = fakeNvdBuffer()
    const expected = Array.from(new Uint8Array(buffer))
    const out = parseNvd(buffer)
    expect(out).toBeInstanceOf(Uint8Array)
    expect(Array.from(out)).toEqual(expected)
  })

  it('wrapping bytes in a .nvd File and reading them back is byte-identical', async () => {
    const buffer = fakeNvdBuffer()
    const expected = Array.from(new Uint8Array(buffer))
    // This is the same wrap handleMessage()/applyDocument do before
    // nv.loadDocument(File): the bytes are carried through unchanged.
    const out = await readNvdFile(fakeNvdFile(buffer))
    expect(Array.from(out)).toEqual(expected)
  })

  it('is a stable fixed point: read -> re-wrap -> read drops/mutates nothing', async () => {
    const buffer = fakeNvdBuffer()
    const once = await readNvdFile(fakeNvdFile(buffer))
    const twice = await readNvdFile(fakeNvdFile(once.slice().buffer))
    expect(Array.from(twice)).toEqual(Array.from(once))
  })
})
