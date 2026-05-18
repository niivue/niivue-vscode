import { describe, expect, it, vi } from 'vitest'
import { getHtmlForWebview } from '../src/html'
import { Uri } from './vscode-mock'

/** Stub the bits of vscode.Webview that html.ts touches. */
function makeWebview() {
  return {
    cspSource: 'https://test.vscode-cdn.net',
    asWebviewUri: vi.fn((uri: Uri) => ({
      toString: () => `https://test.vscode-cdn.net${uri.path}`,
    })),
  }
}

describe('getHtmlForWebview', () => {
  it('produces a complete HTML document', async () => {
    const extensionUri = Uri.parse('file:///ext')
    const html = await getHtmlForWebview(makeWebview() as any, extensionUri)
    expect(html).toMatch(/^\s*<!doctype html>/i)
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<div id="app"')
  })

  it('wires asWebviewUri for every bundled asset', async () => {
    const extensionUri = Uri.parse('file:///ext')
    const webview = makeWebview()
    const html = await getHtmlForWebview(webview as any, extensionUri)
    // index.js, index.css, vscode-styles.css — three asWebviewUri calls.
    expect(webview.asWebviewUri).toHaveBeenCalledTimes(3)
    expect(html).toContain('niivue/index.js')
    expect(html).toContain('niivue/index.css')
    expect(html).toContain('vscode-styles.css')
  })

  it('embeds a CSP that pins all sources to webview.cspSource (no wildcard hosts)', async () => {
    const extensionUri = Uri.parse('file:///ext')
    const webview = makeWebview()
    const html = await getHtmlForWebview(webview as any, extensionUri)
    const cspMatch = html.match(/Content-Security-Policy" content="([^"]+)"/)
    expect(cspMatch).toBeTruthy()
    const csp = cspMatch![1]
    // default-src is locked down...
    expect(csp).toContain("default-src 'none'")
    // ...all source directives reference the webview's cspSource (no *)...
    expect(csp).toContain('img-src data: blob: https://test.vscode-cdn.net')
    expect(csp).toContain("style-src https://test.vscode-cdn.net 'unsafe-inline'")
    expect(csp).toContain('connect-src data: blob: https://test.vscode-cdn.net')
    // ...and there's no `*` in the CSP at all (guards against accidental loosening).
    expect(csp).not.toMatch(/(\s|=)\*(\s|;|$)/)
  })

  it('generates a unique 32-char alphanumeric nonce on each call', async () => {
    const extensionUri = Uri.parse('file:///ext')
    const html1 = await getHtmlForWebview(makeWebview() as any, extensionUri)
    const html2 = await getHtmlForWebview(makeWebview() as any, extensionUri)

    // nonce appears in both the CSP and the <script> tags — extract from script.
    const nonceFrom = (html: string) => {
      const m = html.match(/nonce-([A-Za-z0-9]+)/)
      expect(m).toBeTruthy()
      return m![1]
    }

    const n1 = nonceFrom(html1)
    const n2 = nonceFrom(html2)
    expect(n1).toMatch(/^[A-Za-z0-9]{32}$/)
    expect(n2).toMatch(/^[A-Za-z0-9]{32}$/)
    expect(n1).not.toBe(n2) // probabilistic but ~62^32 collision space
  })

  it('uses the same nonce in CSP script-src and on every <script> tag', async () => {
    const extensionUri = Uri.parse('file:///ext')
    const html = await getHtmlForWebview(makeWebview() as any, extensionUri)
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)![1]
    const cspNonce = csp.match(/script-src 'nonce-([A-Za-z0-9]+)'/)![1]
    // Every script tag must carry the same nonce.
    const scriptNonces = [...html.matchAll(/<script[^>]*nonce="([A-Za-z0-9]+)"/g)].map((m) => m[1])
    expect(scriptNonces.length).toBeGreaterThan(0)
    for (const n of scriptNonces) expect(n).toBe(cspNonce)
  })

  it('routes assets through the supplied extensionUri (no hard-coded paths)', async () => {
    const customExt = Uri.parse('file:///some/other/ext-root')
    const webview = makeWebview()
    await getHtmlForWebview(webview as any, customExt)
    // Each asWebviewUri call was given a Uri rooted at /some/other/ext-root.
    for (const call of webview.asWebviewUri.mock.calls) {
      const uri = call[0] as Uri
      expect(uri.path).toContain('/some/other/ext-root')
    }
  })
})
