import * as vscode from 'vscode';
import { NiiVueDocument } from './document';
import { getHtmlForWebview } from './html';

export class NiiVueEditorProvider implements vscode.CustomReadonlyEditorProvider<NiiVueDocument> {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            NiiVueEditorProvider.viewType,
            new NiiVueEditorProvider(context),
            {
                webviewOptions: { retainContextWhenHidden: true },
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

    async openCustomDocument(uri: vscode.Uri): Promise<NiiVueDocument> {
        console.log(`Opening document ${uri}`);
        const data: Uint8Array = await vscode.workspace.fs.readFile(uri);
        return new NiiVueDocument(uri, data);
    }

    public static async createOrShow(context: vscode.ExtensionContext, uri: vscode.Uri) {
        const name = vscode.Uri.parse(uri.toString()).path.split("/").pop();
        const panel = vscode.window.createWebviewPanel(
            'niiVue.webView',
            name ? `web: ${name}` : "NiiVue Web Panel",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = await getHtmlForWebview(panel.webview, context.extensionUri);
        const editor = new NiiVueEditorProvider(context);
        editor.webviews.add(uri, panel);
        NiiVueEditorProvider.addCommonListeners(panel);
        panel.webview.onDidReceiveMessage(async (e) => {
            if (e.type === 'ready') {
                panel.webview.postMessage({
                    type: 'webUrl',
                    body: { url: uri.toString() }
                });
            }
        });
    }

    public static async createCompareView(context: vscode.ExtensionContext, items: any) {
        const uris = items.map((item: any) => vscode.Uri.parse(item));
        const panel = vscode.window.createWebviewPanel(
            'niiVue.compareView',
            "NiiVue Compare Panel",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = await getHtmlForWebview(panel.webview, context.extensionUri);
        const editor = new NiiVueEditorProvider(context);
        editor.webviews.add(uris[0], panel);
        NiiVueEditorProvider.addCommonListeners(panel);
        panel.webview.onDidReceiveMessage(async (e) => {
            if (e.type === 'ready') {
                panel.webview.postMessage({
                    type: 'initCanvas',
                    body: { n: uris.length }
                });
                for (const uri of uris) {
                    const data = await vscode.workspace.fs.readFile(uri);
                    panel.webview.postMessage({
                        type: 'addImage',
                        body: {
                            data: data.buffer,
                            uri: uri.toString(),
                        }
                    });
                }
            }
        });
    }

    private static addCommonListeners(panel: vscode.WebviewPanel) {
        const fileTypes = { 'neuroImages': ['nii', 'nii.gz', 'dcm', 'mha', 'mhd', 'nhdr', 'nrrd', 'mgh', 'mgz', 'v', 'v16', 'vmr'] };
        panel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'addOverlay':
                    vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        openLabel: 'Open Overlay',
                        // filters: fileTypes // does't work properly in remote
                    }).then((uris) => {
                        if (uris && uris.length > 0) {
                            vscode.workspace.fs.readFile(uris[0]).then((data) => {
                                panel.webview.postMessage({
                                    type: 'overlay',
                                    body: {
                                        data: data.buffer,
                                        uri: uris[0].toString(),
                                    }
                                });
                            });
                        }
                    });
                    return;
                case 'addImages':
                    vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: true,
                        openLabel: 'Open Images',
                        // filters: fileTypes
                    }).then(async (uris) => {
                        if (uris) {
                            panel.webview.postMessage({
                                type: 'initCanvas',
                                body: { n: uris.length }
                            });
                            for (const uri of uris) {
                                const data = await vscode.workspace.fs.readFile(uri);
                                panel.webview.postMessage({
                                    type: 'addImage',
                                    body: {
                                        data: data.buffer,
                                        uri: uri.toString(),
                                    }
                                });
                            }
                        }
                    });
                    return;
            }
        });
    }


    async resolveCustomEditor(document: NiiVueDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
        this.webviews.add(document.uri, webviewPanel);
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = await getHtmlForWebview(webviewPanel.webview, this._context.extensionUri);
        NiiVueEditorProvider.addCommonListeners(webviewPanel);
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'ready') {
                webviewPanel.webview.postMessage({
                    type: 'localDocument',
                    body: {
                        data: document.data.buffer,
                        uri: document.uri.toString(),
                    }
                });
            }
        });
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