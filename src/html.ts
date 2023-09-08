import * as vscode from 'vscode';

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	const niiVue = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'node_modules', '@niivue', 'niivue', 'dist', 'niivue.umd.js'));
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
	const nonce = getNonce(); // Whitelist which scripts can be run

	return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>NiiVue</title>
			</head>
			<body>
				<div id="MetaData" style="color: white">MetaData</div>
				<div id="container">
					<canvas id="gl" width="640" height="640"></canvas>
				</div>
				<div id="footer" style="clear: left">
					<footer id="intensity" style="color: white">&nbsp;</footer>
					<button id="AddOverlayButton">Add Overlay</button>
					<input type="checkbox" id="NearestInterpolation">
					<label for="checkbox" style="color: white">No Interpolation</label>
				</div>

				<script nonce="${nonce}" src=${niiVue}></script>
				<script nonce="${nonce}" src=${scriptUri}></script>
			</body>
		</html>`;
}