import * as vscode from 'vscode';
import * as path from 'path';
import { NiiVueDocument } from './document';

export class NiiVueEditorProvider implements vscode.CustomReadonlyEditorProvider<NiiVueDocument> {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            NiiVueEditorProvider.viewType,
            new NiiVueEditorProvider(context),
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        );
    }

    private static readonly viewType = 'niiVue.default';
    private readonly webviews = new WebviewCollection();

    constructor(
        private readonly _context: vscode.ExtensionContext
    ) {
    }

    async openCustomDocument(
        uri: vscode.Uri
    ): Promise<NiiVueDocument> {
        console.log(`Open document now ${uri}`);
        const data: Uint8Array = await vscode.workspace.fs.readFile(uri);
        return new NiiVueDocument(uri, data);
    }

    async resolveCustomEditor(
        document: NiiVueDocument,
        webviewPanel: vscode.WebviewPanel,
    ): Promise<void> {
        this.webviews.add(document.uri, webviewPanel);
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = await this.getHtmlForWebview(webviewPanel.webview);
        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            if (e.type === 'ready') {
                webviewPanel.webview.postMessage({
                    type: 'init',
                    body: {
                        data: document.data.buffer,
                        uri: document.uri.toString(),
                    }
                });
            }
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        // const niiVue = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'node_modules', '@niivue', 'niivue', 'dist', 'niivue.umd.js'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'dist/niivue', 'main.js'));
        const uri = vscode.Uri.file(path.join(this._context.extensionPath, 'dist/niivue', 'index.html'));
        const html = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(html).toString('utf8')
            .replace(/\$\{scriptUri\}/g, scriptUri.toString());
    }
}

class WebviewCollection {
    private readonly _webviews = new Set<{
        readonly resource: string;
        readonly webviewPanel: vscode.WebviewPanel;
    }>();

    public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
        const key = uri.toString();
        for (const entry of this._webviews) {
            if (entry.resource === key) {
                yield entry.webviewPanel;
            }
        }
    }

    public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
        const entry = { resource: uri.toString(), webviewPanel };
        this._webviews.add(entry);

        webviewPanel.onDidDispose(() => {
            this._webviews.delete(entry);
        });
    }
}