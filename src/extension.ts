import * as vscode from 'vscode';
import { NiiVueEditorProvider } from './editorProvider';
import { NiiVueWebViewPanel } from './webViewPanel';
import { LinkHoverProvider } from './HoverProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(NiiVueEditorProvider.register(context));
	context.subscriptions.push(vscode.languages.registerHoverProvider('*', new LinkHoverProvider()));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.open', async () => {
		vscode.window.showInputBox({
			prompt: 'File Path',
			placeHolder: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
		}).then((input) => {
			if (input) {
				const uri = vscode.Uri.parse(input);
				NiiVueWebViewPanel.createOrShow(context.extensionUri, uri);
			}
		});
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.openLink', async (args: any) => {
		NiiVueWebViewPanel.createOrShow(context.extensionUri, args.resourceUri);
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.openLocal', async (args: any) => {
		vscode.commands.executeCommand('vscode.openWith', args.resourceUri, "niiVue.default");
	}
	));
	context.subscriptions.push(vscode.commands.registerCommand('niiVue.compareFromExplorer', async (_activeItem: any, items: any) => {
		NiiVueWebViewPanel.createCompareView(context.extensionUri, items);
	}
	));
}

export function deactivate() { }