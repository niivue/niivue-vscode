import * as vscode from 'vscode';

export class LinkHoverProvider implements vscode.HoverProvider {

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
        const extensions = ['.nii.gz', '.nii', '.dcm', '.mih', '.mif', '.nhdr', '.nrrd', '.mhd', '.mha', '.mgh', '.mgz', '.v', '.v16', '.vmr', '.head'];

        return new Promise((resolve, reject) => {
            const webPattern = new RegExp(`https?:\\/\\/(?:[\\w.-]+)\\/(\\S+(${extensions.map(ext => ext.replace('.', '\\.')).join('|')})\\b)`, 'i');
            const wordRange = document.getWordRangeAtPosition(position, webPattern);
            if (wordRange) {
                const linkText = document.getText(wordRange);
                const args = [{ resourceUri: vscode.Uri.parse(linkText) }];
                const commandUri = vscode.Uri.parse(`command:niiVue.openLink?${encodeURIComponent(JSON.stringify(args))}`);
                vscode.window.showInformationMessage(`Command Uri: ${commandUri}`);
                const contents = new vscode.MarkdownString(`[Search String](${commandUri})`);
                contents.isTrusted = true;
                resolve(new vscode.Hover(contents));
            } else {
                reject();
            }
        });
    }
}
