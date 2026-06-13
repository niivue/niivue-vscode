import { NVDocument, type DocumentData } from '@niivue/niivue'
import { describe, expect, it } from 'vitest'

/**
 * Phase 0 of the Viewer-Host Protocol work: pin the scene contract. We adopt
 * niivue's NVDocument serialization as-is (no schema layer), so this golden
 * test guards against round-trip fidelity regressions in the `.nvd` document
 * data the protocol relies on.
 *
 * It runs at the document-data layer (`NVDocument.loadFromJSON` -> `json()`),
 * which needs no WebGL. The full renderer round-trip (drop -> import -> export)
 * and mesh-layer-name fidelity (a known lossy area upstream, which needs a real
 * loaded mesh) are covered by the PWA Playwright E2E.
 */

const fixture: DocumentData = {
  title: 'golden.nvd',
  opts: {
    isColorbar: true,
    show3Dcrosshair: true,
    sliceType: 3,
  },
  sceneData: {
    crosshairPos: [0.4, 0.5, 0.6],
  },
  imageOptionsArray: [],
  encodedImageBlobs: [],
  encodedDrawingBlob: '',
  meshesString: '',
}

// previewImageDataURL/imageOptionsMap are presentation/derived, not part of the
// persisted contract; ignore them when comparing two serializations.
function stripVolatile(doc: Record<string, unknown>) {
  const { previewImageDataURL: _p, imageOptionsMap: _m, ...rest } = doc as Record<string, unknown>
  return rest
}

describe('NVDocument .nvd round-trip (Phase 0 golden)', () => {
  // Model the real `.nvd` path: serialize to a JSON string (downloadNvd) and
  // parse it back (readNvdFile). This also drops the export-only Map field.
  const asNvdJson = (doc: object) => JSON.parse(JSON.stringify(doc)) as DocumentData

  it('preserves title and non-default opts through a load/serialize cycle', async () => {
    const doc = await NVDocument.loadFromJSON(asNvdJson(fixture))
    const out = doc.json()

    expect(out.title).toBe('golden.nvd')
    expect(out.opts.isColorbar).toBe(true)
    expect(out.opts.show3Dcrosshair).toBe(true)
    expect(out.opts.sliceType).toBe(3)
  })

  it('is a stable fixed point (no fields dropped or mutated on reload)', async () => {
    // once = the bytes a first export would write to the .nvd file
    const once = asNvdJson((await NVDocument.loadFromJSON(asNvdJson(fixture))).json())
    // twice = re-import those bytes and export again
    const twice = asNvdJson((await NVDocument.loadFromJSON(once)).json())
    expect(stripVolatile(twice)).toEqual(stripVolatile(once))
  })
})
