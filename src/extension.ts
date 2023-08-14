import * as vscode from 'vscode';
import { NiiVueEditorProvider } from './editorProvider';
import { NiiVueWebPanel } from './webPanel';
import { LinkHoverProvider } from './HoverProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(NiiVueEditorProvider.register(context));
	context.subscriptions.push(vscode.languages.registerHoverProvider('*', new LinkHoverProvider()));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.open', async () => {
		const input = await vscode.window.showInputBox({
			prompt: 'File Path',
			placeHolder: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
		});
		if (input) {
			const uri = vscode.Uri.parse(input);
			vscode.window.showInformationMessage(`To display: ${uri}`);
			NiiVueWebPanel.createOrShow(context.extensionUri, uri);
		}
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.openLink', async (args: any) => {
		NiiVueWebPanel.createOrShow(context.extensionUri, args.resourceUri);
	}
	));
}

export function deactivate() { }