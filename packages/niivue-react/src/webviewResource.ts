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
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }
  const name = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  return new File([await response.blob()], name)
}
