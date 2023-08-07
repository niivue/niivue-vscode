import * as vscode from 'vscode';
import { NiiVueEditorProvider } from './editorProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(NiiVueEditorProvider.register(context));
}

export function deactivate() { }