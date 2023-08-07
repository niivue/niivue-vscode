import * as vscode from 'vscode';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}

export class NiiVuePanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: NiiVuePanel | undefined;

    public static readonly viewType = 'NiiVue.Default';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (NiiVuePanel.currentPanel) {
            NiiVuePanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            NiiVuePanel.viewType,
            'NiiVue',
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri),
        );

        NiiVuePanel.currentPanel = new NiiVuePanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        NiiVuePanel.currentPanel = new NiiVuePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
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

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    public dispose() {
        NiiVuePanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    // async openCustomDocument(
    //     uri: vscode.Uri
    //   ): Promise<NiftiDocument> {
    //     console.log(`Open document ${uri}`);
    //     const data: Uint8Array = await vscode.workspace.fs.readFile(uri);
    //     const document: NiftiDocument = new NiftiDocument(uri, data);
    //     return document;
    //   }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Local path to main script run in the webview
        // const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

        // And the uri we use to load this script in the webview
        // const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        // const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        // const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

        // Uri to load styles into webview
        // const stylesResetUri = webview.asWebviewUri(styleResetPath);
        // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

        // Use a nonce to only allow specific scripts to be run
        // const nonce = getNonce();

        return `<!DOCTYPE html>
		<html lang="en">
		  <head>
			<meta charset="utf-8" />
			<title>NiiVue</title>
		  </head>
		  <body>
			<canvas id="gl" width="640" height="640"></canvas>
		  </body>
		  <script src="https://niivue.github.io/niivue/features/niivue.umd.js"></script>
		  <script>
			var volumeList = [
			  { url: "https://niivue.github.io/niivue-demo-images/mni152.nii.gz" },
			];
			var nv = new niivue.Niivue({ isResizeCanvas: false });
			nv.attachTo("gl");
			nv.loadVolumes(volumeList);
		  </script>
		</html>`;


        // let volume = await NVImage.loadFromUrl(imageOptions);
        // this.document.addImageOptions(volume, imageOptions);
        // volume.onColormapChange = this.onColormapChange;
        // this.mediaUrlMap.set(volume, imageOptions.url);
        // if (this.onVolumeAddedFromUrl) {
        //     this.onVolumeAddedFromUrl(imageOptions, volume);
        // }
        // this.addVolume(volume);
        // return volume;
        // "D:/TGV/tmp/deg/chi_0.nii"

        // return `<!DOCTYPE html>
        // 	<html lang="en">
        // 	<head>
        // 		<meta charset="UTF-8">

        // 		<!--
        // 			Use a content security policy to only allow loading images from https or from our extension directory,
        // 			and only allow scripts that have a specific nonce.
        // 		-->
        // 		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

        // 		<meta name="viewport" content="width=device-width, initial-scale=1.0">

        // 		<link href="${stylesResetUri}" rel="stylesheet">
        // 		<link href="${stylesMainUri}" rel="stylesheet">

        // 		<title>Cat Coding</title>
        // 	</head>
        // 	<body>
        // 		<img src="${catGifPath}" width="300" />
        // 		<h1 id="lines-of-code-counter">0</h1>

        // 		<script nonce="${nonce}" src="${scriptUri}"></script>
        // 	</body>
        // 	</html>`;
    }
}
