/**
 * JSON form of NiiVue `.nvd` scene documents.
 *
 * NiiVue reads and writes documents as CBOR (the default) or as JSON, where a
 * typed array is `{ "$ta": "Uint8Array", "b64": "<base64>" }`. A JSON document
 * opened here can also be hand-authored and sparse, e.g.
 *   { "volumes": [{ "url": "brain.nii.gz", "colormap": "gray" }] }
 * or carry embedded bytes as `{ "$bin": "<base64>" }`, the tag earlier exports
 * of this viewer used. Such a document is completed and retagged before NiiVue
 * loads it; NiiVue does the actual decoding and scene restore.
 */

// Top-level fields NiiVue's loader reads without a fallback.
const REQUIRED_FIELDS: Record<string, () => unknown> = {
  version: () => 1,
  scene: () => ({}),
  layout: () => ({}),
  clipPlanes: () => [],
  volumes: () => [],
  meshes: () => [],
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

const isBinTag = (x: unknown): x is { $bin: string } =>
  isPlainObject(x) && Object.keys(x).length === 1 && typeof x.$bin === 'string'

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

/**
 * A JSON document as NiiVue's loader accepts it: `$bin` tags become NiiVue's
 * `$ta` tags, missing required fields are added and a BOM is dropped. A
 * document that needs none of that is returned as it is.
 */
export function normalizeJsonNvd(bytes: Uint8Array): Uint8Array {
  let changed = bytes[0] === 0xef // NiiVue does not skip a UTF-8 BOM
  // TextDecoder drops the BOM.
  const doc: unknown = JSON.parse(new TextDecoder().decode(bytes), (_key, value) => {
    if (!isBinTag(value)) {
      return value
    }
    changed = true
    return { $ta: 'Uint8Array', b64: value.$bin }
  })
  if (!isPlainObject(doc)) {
    throw new Error('A JSON scene document must be an object')
  }
  for (const [field, fallback] of Object.entries(REQUIRED_FIELDS)) {
    if (doc[field] === undefined) {
      doc[field] = fallback()
      changed = true
    }
  }
  return changed ? new TextEncoder().encode(JSON.stringify(doc)) : bytes
}

/** NiiVue's JSON serialization (`serializeDocument({ format: 'json' })`), indented. */
export function indentJsonNvd(bytes: Uint8Array): Uint8Array {
  const doc: unknown = JSON.parse(new TextDecoder().decode(bytes))
  return new TextEncoder().encode(JSON.stringify(doc, null, 2))
}
