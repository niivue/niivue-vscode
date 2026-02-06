import { PageConfig, URLExt } from '@jupyterlab/coreutils'
import { ServerConnection } from '@jupyterlab/services'

/**
 * Constructs a URL using the JupyterLab base URL.
 * Uses URLExt.join for proper path joining with JupyterHub prefixes.
 */
export function getJupyterUrl(path: string): string {
  return URLExt.join(PageConfig.getBaseUrl(), path)
}

/**
 * Constructs a file URL using server settings base URL.
 * This respects JupyterHub prefixes like /user/<name>/.
 */
export function getFileUrl(baseUrl: string, filePath: string): string {
  return URLExt.join(baseUrl, 'files', URLExt.encodeParts(filePath))
}

/**
 * Constructs a contents API URL using server settings base URL.
 * This respects JupyterHub prefixes like /user/<name>/.
 */
export function getContentsUrl(baseUrl: string, path: string): string {
  return URLExt.join(baseUrl, 'api/contents', URLExt.encodeParts(path))
}

/**
 * Fetches an ArrayBuffer from the given URL using ServerConnection.
 * Handles authentication and provides detailed error messages.
 */
export async function fetchArrayBuffer(
  url: string,
  serverSettings: ServerConnection.ISettings,
): Promise<ArrayBuffer> {
  let response: Response
  try {
    response = await ServerConnection.makeRequest(url, { method: 'GET' }, serverSettings)
  } catch (error) {
    throw new Error(
      `Request failed (${url}): ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!response.ok) {
    let detail = ''
    try {
      const text = await response.text()
      if (text) {
        detail = `; ${text.slice(0, 300)}`
      }
    } catch {
      // ignore
    }
    throw new Error(`HTTP ${response.status} ${response.statusText}${detail}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    throw new Error(
      `Unexpected HTML response (likely auth redirect). Final URL: ${response.url || url}`,
    )
  }

  return response.arrayBuffer()
}

/**
 * Fetches JSON from the given URL using ServerConnection.
 * Handles authentication and provides detailed error messages.
 */
export async function fetchJson<T>(
  url: string,
  serverSettings: ServerConnection.ISettings,
): Promise<T> {
  const response = await ServerConnection.makeRequest(url, { method: 'GET' }, serverSettings)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}
