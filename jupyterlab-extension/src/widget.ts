import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry'

import { Widget } from '@lumino/widgets'

import { Message } from '@lumino/messaging'

// Note: @niivue/niivue will be available at runtime
// For now, we'll define a minimal interface to avoid TypeScript errors
interface INiivue {
  attachToCanvas(canvas: HTMLCanvasElement): Promise<void>
  loadVolumes(volumes: any[]): Promise<void>
  resizeListener(): void
}

declare const Niivue: {
  new (options?: any): INiivue
}

/**
 * A widget for displaying NiiVue medical image viewer content.
 */
class NiiVueWidget extends Widget {
  private _niivue: INiivue | null = null
  private _canvas: HTMLCanvasElement | null = null
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel>

  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    super()
    this._context = context
    this.addClass('jp-NiiVueWidget')

    // Create the canvas element
    this._canvas = document.createElement('canvas')
    this._canvas.style.width = '100%'
    this._canvas.style.height = '100%'
    this.node.appendChild(this._canvas)
  }

  /**
   * Handle after-attach messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this._initializeNiiVue()
  }

  /**
   * Handle resize messages for the widget.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    if (this._niivue && this._canvas) {
      this._niivue.resizeListener()
    }
  }

  /**
   * Initialize the NiiVue viewer.
   */
  private async _initializeNiiVue(): Promise<void> {
    if (!this._canvas || this._niivue) {
      return
    }

    try {
      // Initialize NiiVue
      this._niivue = new Niivue({
        show3Dcrosshair: true,
        backColor: [0, 0, 0, 1],
        crosshairColor: [1, 0, 0, 1],
      })

      await this._niivue.attachToCanvas(this._canvas)

      // Load the file
      await this._loadFile()
    } catch (error) {
      console.error('Failed to initialize NiiVue:', error)
      this._showError('Failed to initialize NiiVue viewer')
    }
  }

  /**
   * Load the medical image file.
   */
  private async _loadFile(): Promise<void> {
    if (!this._niivue) {
      return
    }

    try {
      const filePath = this._context.path

      // For now, create a simple volume object
      // In a real implementation, you would read the file content
      // and convert it to the appropriate format for NiiVue
      const volume = {
        url: filePath,
        name: filePath.split('/').pop() || 'Medical Image',
      }

      await this._niivue.loadVolumes([volume])
    } catch (error) {
      console.error('Failed to load medical image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this._showError(`Failed to load medical image: ${errorMessage}`)
    }
  }

  /**
   * Show an error message in the widget.
   */
  private _showError(message: string): void {
    this.node.innerHTML = `
      <div class="jp-NiiVue-error">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `
  }

  /**
   * Dispose of the widget.
   */
  dispose(): void {
    if (this._niivue) {
      // Clean up NiiVue resources
      this._niivue = null
    }
    super.dispose()
  }
}

/**
 * A document widget for viewing medical images with NiiVue.
 */
export class NiiVueDocumentWidget extends DocumentWidget<NiiVueWidget, DocumentRegistry.IModel> {
  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    // Create the content widget
    const content = new NiiVueWidget(context)

    // Create the document widget with content
    super({ context, content })

    this.addClass('jp-NiiVueDocumentWidget')

    // Set up the title
    const filename = context.path.split('/').pop() || 'Medical Image'
    this.title.label = filename
    this.title.iconClass = 'jp-MaterialIcon jp-ImageIcon'
  }

  /**
   * Handle URI fragment changes.
   */
  setFragment(fragment: string): void {
    // For medical images, we might use fragments for slice navigation
    // For now, just log the fragment
    console.log('NiiVue setFragment:', fragment)
  }
}
