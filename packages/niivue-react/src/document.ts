import type { SceneDocument } from '@niivue/viewer-protocol'
import { indentJsonNvd, looksLikeJsonNvd, normalizeJsonNvd } from './nvd-json'

/**
 * `.nvd` (NiiVue scene document) import/export helpers for browser hosts.
 *
 * NiiVue v1 serializes a scene with `nv.serializeDocument()` as CBOR bytes, or
 * as JSON with `{ format: 'json' }`, and `nv.loadDocument(string | File)` reads
 * either. A JSON document is completed on the way in (see `nvd-json.ts`); the
 * live NiiVue instance stays the source of truth and does the scene restore.
 */

/** True for a filename that is a NiiVue scene document (CBOR or JSON form). */
export function isNvdFile(name: string): boolean {
  const n = name.toLowerCase()
  return n.endsWith('.nvd') || n.endsWith('.nvd.json')
}

/**
 * Return the `.nvd` bytes that `nv.loadDocument` accepts. A CBOR file is
 * passed through untouched; a JSON file is completed so a sparse, hand-authored
 * scene loads too. NiiVue handles any gzip wrapping of CBOR internally.
 */
export function parseNvd(buffer: ArrayBuffer): SceneDocument {
  const bytes = new Uint8Array(buffer)
  return looksLikeJsonNvd(bytes) ? normalizeJsonNvd(bytes) : bytes
}

/** Read a dropped/picked `.nvd` File (or Blob) into the bytes to load. */
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
 * Save bytes as a file. Webview hosts (VS Code, JupyterLab) cannot start a
 * download, so there the bytes go to the host as a base64 `saveFile` message;
 * every other host downloads them.
 */
export function saveFile(bytes: Uint8Array<ArrayBuffer>, filename: string, mimeType: string): void {
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'saveFile', body: { filename, mimeType, data: toBase64(bytes) } })
    return
  }
  triggerDownload(new Blob([bytes], { type: mimeType }), filename)
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  // Chunked: spreading a large array into fromCharCode overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
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
 * Trigger a browser download of a scene document as readable JSON: NiiVue's
 * JSON serialization (`nv.serializeDocument({ format: 'json' })`), indented. It
 * re-opens here and in anything else built on NiiVue.
 */
export function downloadSceneJson(json: Uint8Array, filename = 'scene.nvd.json'): void {
  const name = filename.toLowerCase().endsWith('.json') ? filename : `${filename}.json`
  const blob = new Blob([new Uint8Array(indentJsonNvd(json))], { type: 'application/json' })
  triggerDownload(blob, name)
}
