import type { SceneDocument } from '@niivue/viewer-protocol'
import { cborNvdToJson, jsonNvdToCbor, looksLikeJsonNvd } from './nvd-json'

/**
 * `.nvd` (niivue scene document) import/export helpers for browser hosts.
 *
 * As of niivue v1.0 the native `.nvd` payload is the CBOR byte blob produced by
 * `nv.serializeDocument()` and consumed by `nv.loadDocument(string | File)`. We
 * additionally support a JSON form of the same document (see `nvd-json.ts`): a
 * JSON `.nvd` (hand-authored in an editor, or exported via "Scene as JSON") is
 * transcoded to CBOR on read, and a scene can be exported as readable JSON. The
 * live niivue instance stays the source of truth; we only (trans)code at this
 * seam. The actual scene decode/restore lives inside niivue.
 */

/** True for a filename that is a niivue scene document (CBOR or JSON form). */
export function isNvdFile(name: string): boolean {
  const n = name.toLowerCase()
  return n.endsWith('.nvd') || n.endsWith('.nvd.json')
}

/**
 * Return the `.nvd` bytes that `nv.loadDocument` accepts (CBOR). A CBOR file is
 * passed through untouched; a JSON file is transcoded to CBOR so the same
 * loader path handles both. niivue handles any gzip wrapping of CBOR internally.
 */
export function parseNvd(buffer: ArrayBuffer): SceneDocument {
  const bytes = new Uint8Array(buffer)
  if (looksLikeJsonNvd(bytes)) {
    return jsonNvdToCbor(new TextDecoder().decode(bytes))
  }
  return bytes
}

/** Read a dropped/picked `.nvd` File (or Blob) into the CBOR bytes to load. */
export async function readNvdFile(file: Blob): Promise<SceneDocument> {
  return parseNvd(await file.arrayBuffer())
}

function triggerDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Trigger a browser download of a scene document as native CBOR `.nvd` bytes
 * (the output of `nv.serializeDocument()`).
 */
export function downloadNvd(doc: SceneDocument, filename = 'scene.nvd'): void {
  const name = isNvdFile(filename) ? filename : `${filename}.nvd`
  // Copy into a fresh ArrayBuffer-backed view so the Blob owns standalone bytes.
  const blob = new Blob([new Uint8Array(doc)], { type: 'application/octet-stream' })
  triggerDownload(blob, name)
}

/**
 * Trigger a browser download of a scene document as readable JSON. The CBOR
 * bytes from `nv.serializeDocument()` are decoded to a JSON `.nvd` (embedded
 * binary as `{ $bin: base64 }`); the result re-opens through `parseNvd`.
 */
export function downloadSceneJson(doc: SceneDocument, filename = 'scene.nvd.json'): void {
  const name = filename.toLowerCase().endsWith('.json') ? filename : `${filename}.json`
  const blob = new Blob([cborNvdToJson(new Uint8Array(doc))], { type: 'application/json' })
  triggerDownload(blob, name)
}
