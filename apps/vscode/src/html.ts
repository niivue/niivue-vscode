import * as vscode from 'vscode'

export async function getHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): Promise<string> {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'niivue', 'index.js'),
  )
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'niivue', 'index.css'),
  )
  const nonce = getNonce()
  return `<!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
              <link href="${styleUri}" rel="stylesheet">
              <script type="module" crossorigin src="${scriptUri}" nonce="${nonce}"></script>
            </head>
            <body class="text-white p-0">
              <div id="app" class="w-screen h-screen"></div>
              <script nonce="${nonce}">
                var vscode = acquireVsCodeApi()
              </script>
            </body>
          </html> `
}

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
