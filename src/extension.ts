import * as vscode from 'vscode';
import { NiiVueEditorProvider } from './editorProvider';
import { NiiVueWebPanel } from './webPanel';
import { LinkHoverProvider } from './HoverProvider';
import { NiiVueDocument } from './document';

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
			NiiVueWebPanel.createOrShow(context.extensionUri, uri);
		}
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.openLink', async (args: any) => {
		NiiVueWebPanel.createOrShow(context.extensionUri, args.resourceUri);
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.openLocal', async (args: any) => {
		const uri = args.resourceUri;
		vscode.commands.executeCommand('vscode.openWith', uri, "niiVue.default");
	}
	));
}

export function deactivate() { }