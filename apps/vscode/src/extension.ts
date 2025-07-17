import * as vscode from 'vscode'
import { NiiVueEditorProvider } from './editorProvider'
import { LinkHoverProvider } from './HoverProvider'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(NiiVueEditorProvider.register(context))
  context.subscriptions.push(vscode.languages.registerHoverProvider('*', new LinkHoverProvider()))
  context.subscriptions.push(
    vscode.commands.registerCommand('niivue.openWebLink', async () => {
      vscode.window
        .showInputBox({
          prompt: 'File Path',
          placeHolder: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
        })
        .then((input) => {
          if (input) {
            const uri = vscode.Uri.parse(input)
            NiiVueEditorProvider.createOrShow(context, uri)
          }
        })
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('niiVue.openLink', async (args: any) => {
      NiiVueEditorProvider.createOrShow(context, args.resourceUri)
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('niiVue.openLocal', async (args: any) => {
      vscode.commands.executeCommand('vscode.openWith', args.resourceUri, 'niiVue.default')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'niiVue.compareFromExplorer',
      async (_activeItem: any, items: any) => {
        NiiVueEditorProvider.createCompareView(context, items)
      },
    ),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'niiVue.openFromExplorer',
      async (_activeItem: any, items: any) => {
        const uri = vscode.Uri.parse(items[0])
        const stat = await vscode.workspace.fs.stat(uri)

        if ((stat.type & vscode.FileType.Directory) !== 0) {
          NiiVueEditorProvider.createOrShowDcmFolder(context, uri)
        } else {
          if (items && items.length >= 1) {
            vscode.commands.executeCommand('vscode.openWith', uri, 'niiVue.default')
          } else {
            vscode.window
              .showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: true,
                openLabel: 'Open Image or Mesh',
              })
              .then((uris) => {
                NiiVueEditorProvider.createCompareView(context, uris)
              })
          }
        }
      },
    ),
  )
}

export function deactivate() {}
