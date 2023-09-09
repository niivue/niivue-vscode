import * as vscode from 'vscode';
import { getHtmlForWebview } from './html';

export class NiiVueWebViewPanel {
    public static currentPanel: NiiVueWebViewPanel | undefined;
    public static readonly webViewType = 'niivue.webPanel';
    public static readonly compareViewType = 'niivue.comparePanel';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static async createOrShow(extensionUri: vscode.Uri, uri: vscode.Uri) {
        const name = vscode.Uri.parse(uri.toString()).path.split("/").pop();
        const panel = vscode.window.createWebviewPanel(
            NiiVueWebViewPanel.webViewType,
            name ? `web: ${name}` : "NiiVue Web Panel",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = await getHtmlForWebview(panel.webview, extensionUri);
        panel.webview.onDidReceiveMessage(async (e) => {
            if (e.type === 'ready') {
                panel.webview.postMessage({
                    type: 'webUrl',
                    body: { url: uri.toString() }
                });
            }
        });
        NiiVueWebViewPanel.currentPanel = new NiiVueWebViewPanel(panel);
    }

    public static async createCompareView(extensionUri: vscode.Uri, items: any) {
        const uris = items.map((item: any) => vscode.Uri.parse(item));
        const panel = vscode.window.createWebviewPanel(
            this.compareViewType,
            "NiiVue Compare Panel",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = await getHtmlForWebview(panel.webview, extensionUri);
        panel.webview.onDidReceiveMessage(async (e) => {
            const images = await Promise.all(uris.map(async (uri: vscode.Uri) => {
                const data: Uint8Array = await vscode.workspace.fs.readFile(uri);
                return { data: data.buffer, uri: uri.toString() };
            }));
            if (e.type === 'ready') {
                panel.webview.postMessage({
                    type: 'compare',
                    body: images
                });
            }
        });
        NiiVueWebViewPanel.currentPanel = new NiiVueWebViewPanel(panel);
    }

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
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
        NiiVueWebViewPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}