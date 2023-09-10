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

    async resolveCustomEditor(document: NiiVueDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
        this.webviews.add(document.uri, webviewPanel);
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = await getHtmlForWebview(webviewPanel.webview, this._context.extensionUri);
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    webviewPanel.webview.postMessage({
                        type: 'localDocument',
                        body: {
                            data: document.data.buffer,
                            uri: document.uri.toString(),
                        }
                    });
                    return;
                case 'addOverlay':
                    // open file picker
                    vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        openLabel: 'Open Overlay',
                        filters: {
                            'NIfTI Images': ['nii', 'nii.gz'],
                            'DICOM Images': ['dcm'],
                            'NRRD Images': ['mha', 'mhd', 'nhdr', 'nrrd'],
                            'MGH Images': ['mgh', 'mgz'],
                            'MGZ Images': ['mgh', 'mgz'],
                            'Vista Images': ['v', 'v16', 'vmr'],
                        }
                    }).then((uris) => {
                        if (uris && uris.length > 0) {
                            vscode.workspace.fs.readFile(uris[0]).then((data) => {
                                document.overlay = data;
                                webviewPanel.webview.postMessage({
                                    type: 'overlay',
                                    body: {
                                        data: document.overlay.buffer,
                                        uri: uris[0].toString(),
                                    }
                                });
                            });


                        }
                    });
                    return;
                case 'addImages':
                    // open file picker
                    vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: true,
                        openLabel: 'Open Images',
                        filters: {
                            'NIfTI Images': ['nii', 'nii.gz'],
                            'DICOM Images': ['dcm'],
                            'NRRD Images': ['mha', 'mhd', 'nhdr', 'nrrd'],
                            'MGH Images': ['mgh', 'mgz'],
                            'MGZ Images': ['mgh', 'mgz'],
                            'Vista Images': ['v', 'v16', 'vmr'],
                        }
                    }).then((uris) => {
                        if (uris && uris.length > 0) {
                            // read all files and construct items with {data, uri} and send them to the webview with the message type 'compare'
                            const items = uris.map(async (uri: vscode.Uri) => {
                                const data: Uint8Array = await vscode.workspace.fs.readFile(uri);
                                return { data: data.buffer, uri: uri.toString() };
                            });
                            Promise.all(items).then((items) => {
                                webviewPanel.webview.postMessage({
                                    type: 'compare',
                                    body: items
                                });
                            });
                        }
                    });
                    return;
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