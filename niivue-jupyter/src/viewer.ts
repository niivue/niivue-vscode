import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { Niivue } from '@niivue/niivue';

export class NiivueWidget extends Widget {
  private _niivue: Niivue | null = null;
  private _canvas: HTMLCanvasElement;
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel>;

  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    super();
    this._context = context;
    this.addClass('jp-NiivueWidget');

    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this.node.appendChild(this._canvas);

    this._initializeNiivue();
    this._loadFile();
  }

  private async _initializeNiivue(): Promise<void> {
    try {
      this._niivue = new Niivue();
      await this._niivue.attachToCanvas(this._canvas);

      this._niivue.setSliceType(this._niivue.sliceTypeAxial);
      this._niivue.setSliceMM(true);
      // this._niivue.setRadiological(false);
    } catch (error) {
      console.error('Failed to initialize Niivue:', error);
    }
  }

  private async _loadFile(): Promise<void> {
    if (!this._niivue || !this._context.model) {
      return;
    }

    try {
      const filePath = this._context.path;
      console.log('Loading NIfTI file:', filePath);

      const volume = {
        url: `/files/${filePath}`,
        name: filePath.split('/').pop() || 'volume'
      };

      await this._niivue.loadVolumes([volume]);

      if (this._niivue.volumes && this._niivue.volumes.length > 0) {
        this._niivue.updateGLVolume();
      }

      console.log('NIfTI file loaded successfully');
    } catch (error) {
      console.error('Failed to load NIfTI file:', error);
      this._showError(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private _showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'jp-NiivueWidget-error';
    errorDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d32f2f;">
        <h3>Error Loading NIfTI File</h3>
        <p>${message}</p>
      </div>
    `;
    this.node.innerHTML = '';
    this.node.appendChild(errorDiv);
  }

  onResize(): void {
    if (this._niivue && this._canvas) {
      const rect = this.node.getBoundingClientRect();
      this._canvas.width = rect.width;
      this._canvas.height = rect.height;

      if (this._niivue.volumes && this._niivue.volumes.length > 0) {
        this._niivue.resizeListener();
      }
    }
  }

  dispose(): void {
    if (this._niivue) {
      // this._niivue.destroy();
      this._niivue = null;
    }
    super.dispose();
  }
}


export namespace NiivueViewer {
  export class Factory extends ABCWidgetFactory<DocumentWidget> {
    protected createNewWidget(
      context: DocumentRegistry.IContext<DocumentRegistry.IModel>
    ): DocumentWidget {
      console.log('Creating new Niivue widget for context:', context);
      const content = new NiivueWidget(context);
      const widget = new DocumentWidget({ content, context });
      return widget;
    }
  }
}