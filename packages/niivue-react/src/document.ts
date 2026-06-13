import type { SceneDocument } from '@niivue/viewer-protocol'

/**
 * `.nvd` (niivue NVDocument) import/export helpers for browser hosts.
 *
 * Import reads a dropped/picked file into a plain document object; export
 * triggers a browser download. These are the persistence seam for a host with
 * `persistence: 'download'` (the PWA). The live niivue instance stays the
 * source of truth; we only serialize at this seam (VHP plan section 4).
 */

/** True for a filename that is a niivue scene document. */
export function isNvdFile(name: string): boolean {
  return name.toLowerCase().endsWith('.nvd')
}

/**
 * Parse `.nvd` bytes into a plain document object. Supports both uncompressed
 * JSON and niivue's default gzip-compressed `.nvd` (detected by the gzip magic
 * bytes 0x1f 0x8b and inflated via the platform `DecompressionStream`).
 */
export async function parseNvd(buffer: ArrayBuffer): Promise<SceneDocument> {
  const bytes = new Uint8Array(buffer)
  let text: string
  if (bytes.length > 1 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))
    text = await new Response(stream).text()
  } else {
    text = new TextDecoder().decode(buffer)
  }
  return JSON.parse(text) as SceneDocument
}

/** Read a dropped/picked `.nvd` File (or Blob) into a document object. */
export async function readNvdFile(file: Blob): Promise<SceneDocument> {
  return parseNvd(await file.arrayBuffer())
}

/**
 * Trigger a browser download of a scene document as an (uncompressed) `.nvd`.
 * niivue's loaders accept both compressed and uncompressed `.nvd`, so plain
 * JSON keeps the file human-inspectable and round-trips cleanly.
 */
export function downloadNvd(doc: SceneDocument, filename = 'scene.nvd'): void {
  const name = isNvdFile(filename) ? filename : `${filename}.nvd`
  const blob = new Blob([JSON.stringify(doc)], { type: 'application/json' })
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
