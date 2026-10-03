import { ensureMhaTransform } from './utility'

// NiiVue fetches a URL inside a Web Worker, and a VS Code webview does not serve
// resource requests that come from workers (they time out with a 408). Such URLs
// are fetched here, on the main thread, and handed to NiiVue as a File.

export function isWebviewResourceUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.vscode-resource.vscode-cdn.net')
  } catch {
    return false
  }
}

/** `url` itself, or for a webview resource URL its contents as a File named like the URL. */
export async function loadableSource(url: string): Promise<string | File> {
  if (!isWebviewResourceUrl(url)) {
    return url
  }
  return new File([await fetchBlob(url)], fileNameOfUrl(url))
}

/**
 * `source` as a File whose MHD/MHA header has a TransformMatrix (see
 * ensureMhaTransform). Only the header is read; the rest is sliced, not copied.
 */
export async function mhaWithTransform(source: string | File): Promise<File> {
  const blob = typeof source === 'string' ? await fetchBlob(source) : source
  const name = typeof source === 'string' ? fileNameOfUrl(source) : source.name
  const head = await blob.slice(0, 65536).arrayBuffer()
  const patched = ensureMhaTransform(head)
  return new File(patched === head ? [blob] : [patched, blob.slice(head.byteLength)], name)
}

/** The last path segment of `url`, decoded. */
export function fileNameOfUrl(url: string): string {
  return decodeURIComponent(new URL(url, 'http://localhost/').pathname.split('/').pop() ?? '')
}

async function fetchBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }
  return response.blob()
}
