import { decode, Encoder } from 'cbor-x'

/**
 * JSON <-> CBOR transcoding for niivue `.nvd` scene documents.
 *
 * niivue v1.0 serializes scenes as CBOR (`nv.serializeDocument()` /
 * `nv.loadDocument()`); it has no JSON path. But the on-the-wire object is a
 * plain `NVDocumentData`, so we add JSON support at our own seam: a JSON `.nvd`
 * is parsed and re-encoded to the CBOR that `loadDocument` expects, and a CBOR
 * `.nvd` can be decoded back to readable JSON for editing/export. niivue does
 * all the actual scene restore - we only change the container format here.
 *
 * Why this is useful: a URL-referencing scene
 *   { "volumes": [{ "url": "brain.nii.gz", "colormap": "gray" }] }
 * has no binary fields, so the JSON is small and hand-authorable in an editor
 * and viewed directly. Self-contained scenes (embedded voxel/mesh data) carry
 * `Uint8Array` fields that JSON can't hold; we represent those as
 * `{ "$bin": "<base64>" }` so they round-trip losslessly.
 */

// Plain-CBOR encoder: `useRecords: false` emits vanilla CBOR maps (no cbor-x
// record extension), so the bytes decode with any CBOR reader - including
// niivue's own `decode` - regardless of the cbor-x version it bundles.
// Uint8Array values become CBOR byte strings, which niivue reads back as
// Uint8Array (matching the embedded-data fields of NVDocumentData).
const encoder = new Encoder({ useRecords: false })

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return (
    typeof x === 'object' &&
    x !== null &&
    !Array.isArray(x) &&
    !(x instanceof Uint8Array) &&
    !ArrayBuffer.isView(x)
  )
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  const CHUNK = 0x8000 // avoid call-stack limits / quadratic concat on large embeds
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** JSON side -> niivue side: replace every `{ $bin: base64 }` with a Uint8Array. */
export function reviveBinary(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(reviveBinary)
  if (isPlainObject(x)) {
    const keys = Object.keys(x)
    if (keys.length === 1 && typeof x.$bin === 'string') {
      return base64ToBytes(x.$bin)
    }
    const out: Record<string, unknown> = {}
    for (const k of keys) out[k] = reviveBinary(x[k])
    return out
  }
  return x
}

/** niivue side -> JSON side: replace every Uint8Array with `{ $bin: base64 }`. */
export function encodeBinary(x: unknown): unknown {
  if (x instanceof Uint8Array) return { $bin: bytesToBase64(x) }
  if (Array.isArray(x)) return x.map(encodeBinary)
  if (isPlainObject(x)) {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(x)) out[k] = encodeBinary(x[k])
    return out
  }
  return x
}

// niivue's `applyDocumentToModel` reads these fields without guarding, so a
// document missing any of them throws. The config groups (layout/ui/volume/
// mesh/draw/interaction) are applied via `Object.assign` and may be omitted -
// niivue keeps its own defaults. This lets a hand-authored scene be as small as
// `{ "volumes": [{ "url": "…" }] }`.
const DEFAULT_SCENE = {
  azimuth: 110,
  elevation: 10,
  scaleMultiplier: 1,
  gamma: 1,
  crosshairPos: [0.5, 0.5, 0.5],
  pan2Dxyzmm: [0, 0, 0, 1],
  backgroundColor: [0, 0, 0, 1],
  clipPlaneColor: [0.7, 0, 0.7, 0.5],
  isClipPlaneCutaway: false,
}

const DEFAULT_DOC = {
  version: 1,
  created: '',
  scene: DEFAULT_SCENE,
  clipPlanes: [] as number[],
  volumes: [] as unknown[],
  meshes: [] as unknown[],
}

/** Fill the fields niivue requires so a sparse hand-authored scene still loads. */
export function withDocDefaults(doc: Record<string, unknown>): Record<string, unknown> {
  const scene = { ...DEFAULT_SCENE, ...((doc.scene as object) ?? {}) }
  return { ...DEFAULT_DOC, ...doc, scene }
}

/**
 * Heuristic: do these bytes look like a JSON `.nvd` (vs CBOR)? CBOR documents
 * begin with a map/array major-type byte (0xA0-0xBF) and gzip with 0x1f; JSON
 * begins with `{` or `[` after optional BOM/whitespace.
 */
export function looksLikeJsonNvd(bytes: Uint8Array): boolean {
  let i = 0
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) i = 3 // UTF-8 BOM
  while (
    i < bytes.length &&
    (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)
  ) {
    i++
  }
  return bytes[i] === 0x7b /* { */ || bytes[i] === 0x5b /* [ */
}

/** Transcode a JSON `.nvd` (text) to the CBOR bytes `nv.loadDocument` expects. */
export function jsonNvdToCbor(text: string): Uint8Array {
  const parsed = JSON.parse(text) as Record<string, unknown>
  const doc = reviveBinary(withDocDefaults(parsed))
  return new Uint8Array(encoder.encode(doc))
}

/** Decode CBOR `.nvd` bytes (e.g. from `nv.serializeDocument()`) to pretty JSON. */
export function cborNvdToJson(bytes: Uint8Array): string {
  const doc = encodeBinary(decode(bytes))
  return JSON.stringify(doc, null, 2)
}
