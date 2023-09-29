import * as vscode from 'vscode';

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export async function getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): Promise<string> {
	const preact = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'node_modules', 'htm', 'preact', 'standalone.umd.js'));
	const niiVue = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'node_modules', '@niivue', 'niivue', 'dist', 'niivue.umd.js'));
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
	const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
	const nonce = getNonce(); // Whitelist which scripts can be run

	const html = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(extensionUri, 'media', 'webview.html')).then((buffer) => buffer.toString());
	const noncePlaceholder = '${nonce}';
	const preactPlaceholder = '"node_modules\\htm\\preact\\standalone.umd.js"';
	const niiVuePlaceholder = '"node_modules\\@niivue\\niivue\\dist\\niivue.umd.js"';
	const scriptUriPlaceholder = '"main.js"';
	const cssUriPlaceholder = '"styles.css"';
	return html.replace(noncePlaceholder, nonce).replace(niiVuePlaceholder, niiVue.toString()).replace(scriptUriPlaceholder, scriptUri.toString()).replace(cssUriPlaceholder, cssUri.toString()).replace(preactPlaceholder, preact.toString());
}