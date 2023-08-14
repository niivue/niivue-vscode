import { get } from 'http';
import * as vscode from 'vscode';

export class NiiVueWebPanel {
    public static currentPanel: NiiVueWebPanel | undefined;
    public static readonly viewType = 'niivue.webPanel';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, uri: vscode.Uri) {
        const name = vscode.Uri.parse("https://niivue.github.io/niivue-demo-images/mni152.nii.gz").path.split("/").pop();
        const panel = vscode.window.createWebviewPanel(
            NiiVueWebPanel.viewType,
            name ? `web: ${name}` : "NiiVue Web Panel",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        NiiVueWebPanel.currentPanel = new NiiVueWebPanel(panel, extensionUri, uri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, uri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, extensionUri, uri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        NiiVueWebPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri, uri: vscode.Uri) {
        const niiVue = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'node_modules', '@niivue', 'niivue', 'dist', 'niivue.umd.js'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>NiiVue</title>
            </head>
            <body>
                <canvas id="gl" width="640" height="640"></canvas>
                <script src=${niiVue}></script>
                <script src=${scriptUri}></script>
                <script>
                var volumeList = [
                    { url: "${uri}" },
                  ];
                  var nv = new niivue.Niivue({ isResizeCanvas: false });
                  nv.attachTo("gl");
                  nv.loadVolumes(volumeList);
                </script>
            </body>
        </html>`;
    }
    
}