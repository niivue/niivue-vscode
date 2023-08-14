import * as vscode from 'vscode';
import { NiiVueEditorProvider } from './editorProvider';
import { NiiVueWebPanel } from './webPanel';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(NiiVueEditorProvider.register(context));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.open', async () => {
		const input = await vscode.window.showInputBox({
			prompt: 'File Path',
			placeHolder: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
		});
		if (input) {
			const uri = vscode.Uri.parse(input);

			vscode.window.showInformationMessage(`To display: ${uri}`);
			NiiVueWebPanel.createOrShow(context.extensionUri, uri);
			// await vscode.commands.executeCommand('vscode.openWith', uri, "niivue:default");
			// await vscode.window.showTextDocument(uri);
		}
	}
	));
}

export function deactivate() { }