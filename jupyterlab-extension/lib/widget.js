import { DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
/**
 * A widget for displaying NiiVue medical image viewer content.
 */
class NiiVueWidget extends Widget {
    constructor(context) {
        super();
        this._niivue = null;
        this._canvas = null;
        this._context = context;
        this.addClass('jp-NiiVueWidget');
        // Create the canvas element
        this._canvas = document.createElement('canvas');
        this._canvas.style.width = '100%';
        this._canvas.style.height = '100%';
        this.node.appendChild(this._canvas);
    }
    /**
     * Handle after-attach messages for the widget.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this._initializeNiiVue();
    }
    /**
     * Handle resize messages for the widget.
     */
    onResize(msg) {
        super.onResize(msg);
        if (this._niivue && this._canvas) {
            this._niivue.resizeListener();
        }
    }
    /**
     * Initialize the NiiVue viewer.
     */
    async _initializeNiiVue() {
        if (!this._canvas || this._niivue) {
            return;
        }
        try {
            // Initialize NiiVue
            this._niivue = new Niivue({
                show3Dcrosshair: true,
                backColor: [0, 0, 0, 1],
                crosshairColor: [1, 0, 0, 1],
            });
            await this._niivue.attachToCanvas(this._canvas);
            // Load the file
            await this._loadFile();
        }
        catch (error) {
            console.error('Failed to initialize NiiVue:', error);
            this._showError('Failed to initialize NiiVue viewer');
        }
    }
    /**
     * Load the medical image file.
     */
    async _loadFile() {
        if (!this._niivue) {
            return;
        }
        try {
            const filePath = this._context.path;
            // For now, create a simple volume object
            // In a real implementation, you would read the file content
            // and convert it to the appropriate format for NiiVue
            const volume = {
                url: filePath,
                name: filePath.split('/').pop() || 'Medical Image',
            };
            await this._niivue.loadVolumes([volume]);
        }
        catch (error) {
            console.error('Failed to load medical image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this._showError(`Failed to load medical image: ${errorMessage}`);
        }
    }
    /**
     * Show an error message in the widget.
     */
    _showError(message) {
        this.node.innerHTML = `
      <div class="jp-NiiVue-error">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
    }
    /**
     * Dispose of the widget.
     */
    dispose() {
        if (this._niivue) {
            // Clean up NiiVue resources
            this._niivue = null;
        }
        super.dispose();
    }
}
/**
 * A document widget for viewing medical images with NiiVue.
 */
export class NiiVueDocumentWidget extends DocumentWidget {
    constructor(context) {
        // Create the content widget
        const content = new NiiVueWidget(context);
        // Create the document widget with content
        super({ context, content });
        this.addClass('jp-NiiVueDocumentWidget');
        // Set up the title
        const filename = context.path.split('/').pop() || 'Medical Image';
        this.title.label = filename;
        this.title.iconClass = 'jp-MaterialIcon jp-ImageIcon';
    }
    /**
     * Handle URI fragment changes.
     */
    setFragment(fragment) {
        // For medical images, we might use fragments for slice navigation
        // For now, just log the fragment
        console.log('NiiVue setFragment:', fragment);
    }
}
//# sourceMappingURL=widget.js.map