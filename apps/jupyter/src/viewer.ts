import { PageConfig } from '@jupyterlab/coreutils'
import { IDocumentManager } from '@jupyterlab/docmanager'
import { ABCWidgetFactory, DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry'
import { FileDialog } from '@jupyterlab/filebrowser'
import { Widget } from '@lumino/widgets'

function getJupyterUrl(path: string): string {
  return PageConfig.getBaseUrl() + path
}

export class NiivueWidget extends Widget {
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  protected _iframe: HTMLIFrameElement
  protected _docManager: IDocumentManager

  constructor(
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>,
    docManager: IDocumentManager,
  ) {
    super()
    this._context = context
    this._docManager = docManager
    this.addClass('jp-NiivueWidget')

    this._iframe = document.createElement('iframe')
    this._iframe.style.width = '100%'
    this._iframe.style.height = '100%'
    this._iframe.style.border = 'none'
    this.node.appendChild(this._iframe)

    this._initializeViewer()
  }

  private _initializeViewer(): void {
    try {
      const filePath = this._context.path
      console.log('Initializing this.onResize Niivue viewer for file:', filePath)

      const html = this._getHtmlForViewer()

      // Write HTML to iframe
      this._iframe.srcdoc = html

      // Set up message passing from iframe
      window.addEventListener('message', this._handleIframeMessage.bind(this))

      // Set up message passing
      this._iframe.onload = () => {
        console.log('Iframe loaded, initializing viewer')
        // Send initial settings to initialize the app
        setTimeout(() => {
          this._sendInitSettings()
          // Then send the image
          setTimeout(() => {
            console.log('Sending message with image: ', filePath)
            this._sendAddImageMessage(filePath)
          }, 500)
        }, 100)
      }

      console.log('Niivue viewer initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Niivue viewer:', error)
      this._showError(
        `Failed to initialize viewer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private _getHtmlForViewer(): string {
    // Use the static file handler we set up in handlers.py
    const scriptPath = getJupyterUrl('lab/extensions/@niivue/jupyter/static/niivue/index.js')
    const cssPath = getJupyterUrl('lab/extensions/@niivue/jupyter/static/niivue/index.css')

    return `<!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <style>
                /* Embed critical CSS to avoid loading issues */
                body { margin: 0; padding: 0; background: #1a1a1a; color: white; font-family: system-ui, sans-serif; }
                #app { width: 100vw; height: 100vh; }
                .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
                .error { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; color: #ff6b6b; }
              </style>
              <link rel="stylesheet" crossorigin href="${cssPath}">
            </head>
            <body class="text-white p-0">
              <div id="app" class="w-screen h-screen">
                <div class="loading">Loading NIfTI viewer...</div>
              </div>
              <script>
                // Mock vscode API for Jupyter environment
                window.vscode = {
                  postMessage: function(message) {
                    window.parent.postMessage(message, '*');
                  }
                };
              </script>
              <script type="module" crossorigin src="${scriptPath}"
                      onerror="document.getElementById('app').innerHTML = '<div class=\\"error\\"><h3>Failed to load NIfTI viewer</h3><p>Could not load the required JavaScript files</p></div>';">
              </script>
            </body>
          </html>`
  }

  protected _sendInitSettings(): void {
    if (this._iframe.contentWindow) {
      const defaultSettings = {
        showCrosshairs: true,
        interpolation: true,
        colorbar: false,
        radiologicalConvention: false,
        zoomDragMode: false,
        defaultVolumeColormap: 'gray',
        defaultOverlayColormap: 'redyell',
      }

      console.log('Sending init settings:', defaultSettings)
      this._iframe.contentWindow.postMessage(
        {
          type: 'initSettings',
          body: defaultSettings,
        },
        '*',
      )
    }
  }

  private async _sendAddImageMessage(filePath: string): Promise<void> {
    if (this._iframe.contentWindow) {
      try {
        console.log('Reading file data for:', filePath)

        // Use fetch to read the file directly
        const fileUrl = getJupyterUrl('files/' + filePath)
        console.log('Fetching file from URL:', fileUrl)

        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()
        console.log('Sending file data to iframe, size:', buffer.byteLength)

        // Send the file data directly to the iframe
        this._iframe.contentWindow.postMessage(
          {
            type: 'addImage',
            body: {
              data: buffer,
              uri: filePath,
            },
          },
          '*',
        )
      } catch (error) {
        console.error('Error reading file:', error)
        this._showError(`Could not load file: ${filePath}`)
      }
    }
  }

  private _showError(message: string): void {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'jp-NiivueWidget-error'
    errorDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d32f2f;">
        <h3>Error Loading NIfTI File</h3>
        <p>${message}</p>
      </div>
    `
    this.node.innerHTML = ''
    this.node.appendChild(errorDiv)
  }

  private async _handleIframeMessage(event: MessageEvent): Promise<void> {
    // Only handle messages from our iframe
    if (event.source !== this._iframe.contentWindow) {
      return
    }

    const message = event.data

    switch (message.type) {
      case 'addImages':
        await this._handleAddImages()
        break
      case 'addOverlay':
        await this._handleAddOverlay(message.body)
        break
      case 'addDcmFolder':
        await this._handleAddDcmFolder()
        break
    }
  }

  private async _handleAddImages(): Promise<void> {
    // Use JupyterLab's FileDialog to select files from workspace

    try {
      const result = await FileDialog.getOpenFiles({
        manager: this._docManager,
        filter: (model: any) => {
          // Allow directories for navigation
          if (model.type === 'directory') {
            return true
          }

          // Allow common neuroimaging file extensions
          const ext = model.name.toLowerCase()
          return (
            ext.endsWith('.nii') ||
            ext.endsWith('.nii.gz') ||
            ext.endsWith('.dcm') ||
            ext.endsWith('.mgh') ||
            ext.endsWith('.mgz') ||
            ext.endsWith('.mha') ||
            ext.endsWith('.mhd') ||
            ext.endsWith('.nrrd') ||
            ext.endsWith('.nhdr') ||
            ext.endsWith('.mnc') ||
            ext.endsWith('.v') ||
            ext.endsWith('.v16')
          )
        },
      })

      if (
        result.button.accept &&
        result.value &&
        result.value.length > 0 &&
        this._iframe.contentWindow
      ) {
        // Send initCanvas message first
        this._iframe.contentWindow.postMessage(
          {
            type: 'initCanvas',
            body: { n: result.value.length },
          },
          '*',
        )

        // Then send each file
        for (const item of result.value) {
          const filePath = item.path
          await this._loadFileAndSend(filePath, 'addImage', undefined)
        }
      }
    } catch (error) {
      console.error('Error opening file dialog:', error)
    }
  }

  protected async _loadFileAndSend(
    filePath: string,
    messageType: string,
    body?: any,
  ): Promise<void> {
    if (this._iframe.contentWindow) {
      try {
        const fileUrl = getJupyterUrl('files/' + filePath)
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()

        this._iframe.contentWindow.postMessage(
          {
            type: messageType,
            body: {
              data: buffer,
              uri: filePath,
              ...body,
            },
          },
          '*',
        )
      } catch (error) {
        console.error('Error reading file:', error)
        this._showError(`Could not load file: ${filePath}`)
      }
    }
  }

  private async _handleAddOverlay(body: any): Promise<void> {
    // Use JupyterLab's FileDialog to select a file from workspace
    try {
      const result = await FileDialog.getOpenFiles({
        manager: this._docManager,
        filter: (model: any) => {
          // Allow directories for navigation
          if (model.type === 'directory') {
            return true
          }

          // Allow common neuroimaging file extensions
          const ext = model.name.toLowerCase()
          return (
            ext.endsWith('.nii') ||
            ext.endsWith('.nii.gz') ||
            ext.endsWith('.dcm') ||
            ext.endsWith('.mgh') ||
            ext.endsWith('.mgz') ||
            ext.endsWith('.mha') ||
            ext.endsWith('.mhd') ||
            ext.endsWith('.nrrd') ||
            ext.endsWith('.nhdr') ||
            ext.endsWith('.mnc') ||
            ext.endsWith('.v') ||
            ext.endsWith('.v16')
          )
        },
      })

      if (result.button.accept && result.value && result.value.length > 0) {
        const filePath = result.value[0].path
        await this._loadFileAndSend(filePath, body.type, { index: body.index })
      }
    } catch (error) {
      console.error('Error opening file dialog:', error)
    }
  }

  private async _handleAddDcmFolder(): Promise<void> {
    // Use JupyterLab's FileDialog to select a directory
    const result = await FileDialog.getExistingDirectory({
      manager: this._docManager,
    })

    if (
      result.button.accept &&
      result.value &&
      result.value.length > 0 &&
      this._iframe.contentWindow
    ) {
      const dirPath = result.value[0].path
      try {
        // List all files in the directory
        const response = await fetch(getJupyterUrl('api/contents/' + dirPath))
        if (!response.ok) {
          throw new Error(`Failed to list directory: ${response.statusText}`)
        }

        const dirData = await response.json()
        const files = dirData.content.filter((item: any) => item.type === 'file')

        if (files.length > 0) {
          // Load all files
          const fileBuffers = await Promise.all(
            files.map(async (file: any) => {
              const fileUrl = getJupyterUrl('files/' + file.path)
              const fileResponse = await fetch(fileUrl)
              if (!fileResponse.ok) {
                throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
              }
              return fileResponse.arrayBuffer()
            }),
          )

          this._iframe.contentWindow.postMessage(
            {
              type: 'addImage',
              body: {
                data: fileBuffers,
                uri: files.map((f: any) => f.name),
              },
            },
            '*',
          )
        }
      } catch (error) {
        console.error('Error reading DICOM folder:', error)
        this._showError(`Could not load DICOM folder: ${dirPath}`)
      }
    }
  }

  onResize(): void {
    // Resize is handled by the iframe content
    console.log('Widget resized')
  }

  dispose(): void {
    // Remove message listener
    window.removeEventListener('message', this._handleIframeMessage.bind(this))
    // Cleanup iframe
    if (this._iframe) {
      this._iframe.remove()
    }
    super.dispose()
  }
}

export namespace NiivueViewer {
  export class Factory extends ABCWidgetFactory<DocumentWidget> {
    private _docManager: IDocumentManager

    constructor(options: DocumentRegistry.IWidgetFactoryOptions, docManager: IDocumentManager) {
      super(options)
      this._docManager = docManager
    }

    protected createNewWidget(
      context: DocumentRegistry.IContext<DocumentRegistry.IModel>,
    ): DocumentWidget {
      console.log('Creating new Niivue widget for context:', context)
      const content = new NiivueWidget(context, this._docManager)
      const widget = new DocumentWidget({ content, context })
      return widget
    }
  }

  /**
   * Create a compare view widget for multiple images
   */
  export function createCompareView(
    app: any,
    docManager: IDocumentManager,
    selectedItems: any[],
  ): void {
    const widget = new CompareWidget(selectedItems, docManager)
    widget.title.label = `Compare (${selectedItems.length} images)`
    widget.title.closable = true

    app.shell.add(widget, 'main')
    app.shell.activateById(widget.id)
  }
}

/**
 * Widget for comparing multiple NIfTI images
 * Shares core functionality with NiivueWidget but initializes with multiple panels
 */
class CompareWidget extends NiivueWidget {
  private _selectedItems: any[]

  constructor(selectedItems: any[], docManager: IDocumentManager) {
    // Create a dummy context - we won't use it for compare view
    const dummyContext = {
      path: '',
      localPath: '',
      pathChanged: { connect: () => {} },
    } as any

    super(dummyContext, docManager)
    this._selectedItems = selectedItems
    this.removeClass('jp-NiivueWidget')
    this.addClass('jp-NiivueCompareWidget')
    this.id = `niivue-compare-${Date.now()}`

    // Re-initialize for compare mode
    this._initializeCompareView()
  }

  private _initializeCompareView(): void {
    this._iframe.onload = () => {
      console.log('Compare view iframe loaded')
      setTimeout(() => {
        this._sendInitSettings()
        // Initialize with multiple panels
        if (this._iframe.contentWindow) {
          this._iframe.contentWindow.postMessage(
            {
              type: 'initCanvas',
              body: { n: this._selectedItems.length },
            },
            '*',
          )
        }
        setTimeout(() => {
          this._loadAllImages()
        }, 500)
      }, 100)
    }

    // Trigger onload
    if (this._iframe.contentWindow) {
      this._iframe.onload(new Event('load') as any)
    }
  }

  private async _loadAllImages(): Promise<void> {
    for (const item of this._selectedItems) {
      await this._loadFileAndSend(item.path, 'addImage')
    }
  }
}
