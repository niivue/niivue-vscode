import * as vscode from 'vscode'

export async function getHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): Promise<string> {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'niivue', 'build', 'assets', 'index.js'),
  )
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'niivue', 'build', 'assets', 'index.css'),
  )
  return `<!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <script type="module" crossorigin src=${scriptUri}></script>
              <link rel="stylesheet" crossorigin href=${cssUri}>
            </head>
            <body class="text-white p-0">
              <div id="app" class="w-screen h-screen"></div>
              <script>
                var vscode = acquireVsCodeApi()
              </script>
            </body>
          </html> `
}
