import * as vscode from 'vscode'
import * as path from 'path'

function getNonce() {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export async function getHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  extensionPath: any,
): Promise<string> {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist/niivue', 'main.js'),
  )
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist/niivue', 'index.css'),
  )
  const nonce = getNonce() // Whitelist which scripts can be run
  const noncePlaceholder = '${nonce}'

  const html = await vscode.workspace.fs.readFile(
    vscode.Uri.file(path.join(extensionPath, 'dist/niivue', 'index.html')),
  )
  const scriptUriPlaceholder = '"main.js"'
  const cssUriPlaceholder = '"index.css"'
  return Buffer.from(html)
    .toString('utf8')
    .replace(noncePlaceholder, nonce)
    .replace(scriptUriPlaceholder, scriptUri.toString())
    .replace(cssUriPlaceholder, cssUri.toString())
}
