import * as vscode from 'vscode'
import { NiiVueDocument } from './document'
import { getHtmlForWebview } from './html'

export class NiiVueEditorProvider implements vscode.CustomReadonlyEditorProvider<NiiVueDocument> {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      NiiVueEditorProvider.viewType,
      new NiiVueEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    )
  }

  private static readonly viewType = 'niiVue.default'
  private readonly webviews = new WebviewCollection()

  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(uri: vscode.Uri): Promise<NiiVueDocument> {
    console.log(`Opening document ${uri}`)
    return new NiiVueDocument(uri)
  }

  private static async createPanel(
    context: vscode.ExtensionContext,
    viewType: string,
    tabName: string,
    uri: vscode.Uri,
  ) {
    const panel = vscode.window.createWebviewPanel(viewType, tabName, vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        context.extensionUri,
        vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('/'),
          '..',
        ),
      ],
    })
    panel.webview.html = await getHtmlForWebview(panel.webview, context.extensionUri)
    const editor = new NiiVueEditorProvider(context)
    editor.webviews.add(uri, panel)
    NiiVueEditorProvider.addCommonListeners(panel)
    return panel
  }

  private static postInitSettings(panel: vscode.WebviewPanel) {
    const config = vscode.workspace.getConfiguration('niivue')
    const showCrosshairs = config.get<boolean>('showCrosshairs', true)
    const interpolation = config.get<boolean>('interpolation', true)
    const colorbar = config.get<boolean>('colorbar', false)
    const radiologicalConvention = config.get<boolean>('radiologicalConvention', false)
    const zoomDragMode = config.get<boolean>('zoomDragMode', false)
    const defaultVolumeColormap = config.get<string>('defaultVolumeColormap', 'gray')
    const defaultOverlayColormap = config.get<string>('defaultOverlayColormap', 'redyell')

    panel.webview.postMessage({
      type: 'initSettings',
      body: {
        showCrosshairs,
        interpolation,
        colorbar,
        radiologicalConvention,
        zoomDragMode,
        defaultVolumeColormap,
        defaultOverlayColormap,
      },
    })
  }

  public static async createOrShow(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const name = vscode.Uri.parse(uri.toString()).path.split('/').pop()
    const tabName = name ? `web: ${name}` : 'NiiVue Web Panel'
    this.createPanel(context, 'niivue.webview', tabName, uri).then((panel) => {
      const editor = new NiiVueEditorProvider(context)

      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)

          // Send file URL instead of reading the entire file
          const fileUrl = editor.createFileUrl(uri, panel.webview)
          panel.webview.postMessage({
            type: 'addImage',
            body: { uri: fileUrl },
          })
        }
      })
    })
  }

  public static async createOrShowDcmFolder(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const name = vscode.Uri.parse(uri.toString()).path.split('/').pop()
    const tabName = name ? name : 'NiiVue DICOM'
    this.createPanel(context, 'niivue.webview', tabName, uri).then((panel) => {
      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)
          NiiVueEditorProvider.openDcmFolder(uri, panel)
        }
      })
    })
  }

  public static async createCompareView(context: vscode.ExtensionContext, items: any) {
    const uris = items.map((item: any) => vscode.Uri.parse(item))
    this.createPanel(context, 'niivue.compare', 'NiiVue Compare Panel', uris[0]).then((panel) => {
      const editor = new NiiVueEditorProvider(context)

      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)
          panel.webview.postMessage({
            type: 'initCanvas',
            body: { n: uris.length },
          })
          for (const uri of uris) {
            const fileUrl = editor.createFileUrl(uri, panel.webview)
            panel.webview.postMessage({
              type: 'addImage',
              body: {
                uri: fileUrl,
              },
            })
          }
        }
      })
    })
  }

  private static addCommonListeners(panel: vscode.WebviewPanel) {
    const editor = new NiiVueEditorProvider(null as any) // Temporary instance for createFileUrl method

    panel.webview.onDidReceiveMessage(async (e) => {
      switch (e.type) {
        case 'addOverlay':
          vscode.window
            .showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: false,
              openLabel: 'Open Overlay',
              // filters: fileTypes // doesn't work properly in remote
            })
            .then((uris) => {
              if (uris && uris.length > 0) {
                const fileUrl = editor.createFileUrl(uris[0], panel.webview)
                panel.webview.postMessage({
                  type: e.body.type,
                  body: {
                    uri: fileUrl,
                    index: e.body.index,
                  },
                })
              }
            })
          return
        case 'addImages':
          vscode.window
            .showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: true,
              openLabel: 'Open Images',
              // filters: fileTypes
            })
            .then(async (uris) => {
              if (uris) {
                panel.webview.postMessage({
                  type: 'initCanvas',
                  body: { n: uris.length },
                })
                for (const uri of uris) {
                  // Handle DICOM files differently - send data instead of URL
                  if (uri.path.toLowerCase().endsWith('.dcm')) {
                    const data = await vscode.workspace.fs.readFile(uri)
                    panel.webview.postMessage({
                      type: 'addImage',
                      body: {
                        data: data.buffer,
                        uri: uri.toString(),
                      },
                    })
                  } else {
                    const fileUrl = editor.createFileUrl(uri, panel.webview)
                    panel.webview.postMessage({
                      type: 'addImage',
                      body: {
                        uri: fileUrl,
                      },
                    })
                  }
                }
              }
            })
          return
        case 'addDcmFolder':
          vscode.window
            .showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Open DICOM Folder',
            })
            .then(async (folderUri) => {
              if (folderUri) {
                NiiVueEditorProvider.openDcmFolder(folderUri[0], panel)
              }
            })
          return
      }
    })
  }

  public static async openDcmFolder(folderUri: vscode.Uri, panel: vscode.WebviewPanel) {
    const files = await vscode.workspace.fs.readDirectory(folderUri)
    const fileUris = files.map((file) => vscode.Uri.joinPath(folderUri, file[0]))
    const data = await Promise.all(
      fileUris.map((uri) => vscode.workspace.fs.readFile(uri).then((data) => data.buffer)),
    )
    panel.webview.postMessage({
      type: 'addImage',
      body: {
        data: data,
        uri: fileUris[0].toString(),
      },
    })
  }

  async resolveCustomEditor(
    document: NiiVueDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    this.webviews.add(document.uri, webviewPanel)
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri,
        vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('/'),
          '..',
        ),
      ],
    }
    webviewPanel.webview.html = await getHtmlForWebview(
      webviewPanel.webview,
      this._context.extensionUri,
    )

    NiiVueEditorProvider.addCommonListeners(webviewPanel)

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'ready') {
        NiiVueEditorProvider.postInitSettings(webviewPanel)

        // Handle DICOM and MINC files differently - send data instead of URL
        const lowerCasePath = document.uri.path.toLowerCase()
        if (
          lowerCasePath.endsWith('.dcm') ||
          lowerCasePath.endsWith('.mnc') ||
          !this.isUriAccessible(document.uri)
        ) {
          const data = await vscode.workspace.fs.readFile(document.uri)
          webviewPanel.webview.postMessage({
            type: 'addImage',
            body: {
              data: data.buffer,
              uri: document.uri.toString(),
            },
          })
        } else {
          // Send file URL instead of data for other files
          const fileUrl = this.createFileUrl(document.uri, webviewPanel.webview)
          webviewPanel.webview.postMessage({
            type: 'addImage',
            body: {
              uri: fileUrl,
            },
          })
        }
      }
    })
  }

  private createFileUrl(uri: vscode.Uri, webview: vscode.Webview): string {
    // Use VS Code's secure webview URI system for serving files
    return webview.asWebviewUri(uri).toString()
  }

  private isUriAccessible(uri: vscode.Uri): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      return false
    }
    for (const folder of workspaceFolders) {
      if (uri.path.startsWith(folder.uri.path)) {
        return true
      }
    }
    return false
  }
}

class WebviewCollection {
  private readonly _webviews = new Set<{
    readonly resource: string
    readonly webviewPanel: vscode.WebviewPanel
  }>()

  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString()
    for (const entry of Array.from(this._webviews)) {
      if (entry.resource === key) {
        yield entry.webviewPanel
      }
    }
  }

  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel }
    this._webviews.add(entry)

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry)
    })
  }
}
