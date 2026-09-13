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

/** True for a filename or URL that is a NiiVue scene document (CBOR or JSON form). */
export function isNvdFile(name: string): boolean {
  const n = name.split(/[?#]/)[0].toLowerCase()
  return n.endsWith('.nvd') || n.endsWith('.nvd.json')
}

/**
 * Return the `.nvd` bytes that `nv.loadDocument` accepts. A CBOR file is
 * passed through untouched; a JSON file is completed so a sparse, hand-authored
 * scene loads too. NiiVue handles any gzip wrapping of CBOR internally.
 */
export function parseNvd(buffer: ArrayBuffer | ArrayBufferView): SceneDocument {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer)
  return looksLikeJsonNvd(bytes) ? normalizeJsonNvd(bytes) : bytes
}

/** Read a dropped/picked `.nvd` File (or Blob) into the bytes to load. */
export async function readNvdFile(file: Blob): Promise<SceneDocument> {
  return parseNvd(await file.arrayBuffer())
}

/** A scene document waiting for its canvas: the file's bytes, or a URL to fetch them from. */
export type DocumentSource =
  | { name: string; data: ArrayBuffer | ArrayBufferView }
  | { name: string; url: string }

/** The file `nv.loadDocument` reads for a pending document. */
export async function documentFile(source: DocumentSource): Promise<File> {
  let data: ArrayBuffer | ArrayBufferView
  if ('data' in source) {
    data = source.data
  } else {
    const response = await fetch(source.url)
    if (!response.ok) {
      throw new Error(`Could not fetch ${source.name}: HTTP ${response.status}`)
    }
    data = await response.arrayBuffer()
  }
  const name = source.name.split(/[?#]/)[0].split(/[/\\]/).pop() || 'document.nvd'
  return new File([new Uint8Array(parseNvd(data))], name)
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

/** Saves bytes as a file for a host that should not rely on a browser download. */
export type FileSaver = (
  bytes: Uint8Array<ArrayBuffer>,
  filename: string,
  mimeType: string,
) => void | Promise<void>

let hostFileSaver: FileSaver | null = null

/** Let a host save files itself, e.g. through a native save dialog. */
export function setFileSaver(saver: FileSaver | null): void {
  hostFileSaver = saver
}

/**
 * Save bytes as a file: through a saver the host registered, or in webview
 * hosts (VS Code, JupyterLab), which cannot start a download, as a base64
 * `saveFile` message to the host; every other host downloads them.
 */
export async function saveFile(
  bytes: Uint8Array<ArrayBuffer>,
  filename: string,
  mimeType: string,
): Promise<void> {
  if (hostFileSaver) {
    await hostFileSaver(bytes, filename, mimeType)
    return
  }
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

/** Save a scene document as native CBOR `.nvd` bytes (the output of `nv.serializeDocument()`). */
export function downloadNvd(doc: SceneDocument, filename = 'scene.nvd'): Promise<void> {
  const name = isNvdFile(filename) ? filename : `${filename}.nvd`
  // Copy into a fresh ArrayBuffer-backed view so the file owns standalone bytes.
  return saveFile(new Uint8Array(doc), name, 'application/octet-stream')
}

/**
 * Save a scene document as readable JSON: NiiVue's JSON serialization
 * (`nv.serializeDocument({ format: 'json' })`), indented. It re-opens here and
 * in anything else built on NiiVue.
 */
export function downloadSceneJson(json: Uint8Array, filename = 'scene.nvd.json'): Promise<void> {
  const name = filename.toLowerCase().endsWith('.json') ? filename : `${filename}.json`
  return saveFile(new Uint8Array(indentJsonNvd(json)), name, 'application/json')
}
