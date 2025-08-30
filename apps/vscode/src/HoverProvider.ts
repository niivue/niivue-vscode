import * as vscode from 'vscode'

export class LinkHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): Thenable<vscode.Hover> {
    const extensions = [
      '.nii.gz',
      '.nii',
      '.npy',
      '.npz',
      '.dcm',
      '.mih',
      '.mif',
      '.nhdr',
      '.nrrd',
      '.mhd',
      '.mha',
      '.mgh',
      '.mgz',
      '.v',
      '.v16',
      '.vmr',
      '.head',
    ]

    return new Promise((resolve, reject) => {
      const webPattern = new RegExp(
        `https?:\\/\\/(?:[\\w.-]+)\\/(\\S+(${extensions
          .map((ext) => ext.replace('.', '\\.'))
          .join('|')})\\b)`,
        'i',
      )
      const webWordRange = document.getWordRangeAtPosition(position, webPattern)
      if (webWordRange) {
        const linkText = document.getText(webWordRange)
        const args = [{ resourceUri: vscode.Uri.parse(linkText) }]
        const commandUri = vscode.Uri.parse(
          `command:niiVue.openLink?${encodeURIComponent(JSON.stringify(args))}`,
        )
        const contents = new vscode.MarkdownString(`[Show with NiiVue](${commandUri})`)
        contents.isTrusted = true
        resolve(new vscode.Hover(contents))
      }
      const localPattern = new RegExp(
        `\\b(?:[A-Za-z]:)?\\\\?[\\w\\\\\\s.-]+(${extensions
          .map((ext) => ext.replace('.', '\\.'))
          .join('|')})\\b`,
        'i',
      )
      const localWordRange = document.getWordRangeAtPosition(position, localPattern)
      if (localWordRange) {
        const linkText = document.getText(localWordRange)
        const args = [{ resourceUri: vscode.Uri.file(linkText) }]
        const commandUri = vscode.Uri.parse(
          `command:niiVue.openLocal?${encodeURIComponent(JSON.stringify(args))}`,
        )
        const contents = new vscode.MarkdownString(`[Show with NiiVue](${commandUri})`)
        contents.isTrusted = true
        resolve(new vscode.Hover(contents))
      }
      reject()
    })
  }
}
