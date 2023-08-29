import * as vscode from 'vscode';
import { getHtmlForWebview } from './html';

export class NiiVueWebPanel {
    public static currentPanel: NiiVueWebPanel | undefined;
    public static readonly viewType = 'niivue.webPanel';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, uri: vscode.Uri) {
        const name = vscode.Uri.parse(uri.toString()).path.split("/").pop();
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
        this._panel.webview.html = getHtmlForWebview(this._panel.webview, extensionUri);
        this._panel.webview.onDidReceiveMessage(async (e) => {
            if (e.type === 'ready') {
                this._panel.webview.postMessage({
                    type: 'webUrl',
                    body: { url: uri.toString() }
                });
            }
        });
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
}