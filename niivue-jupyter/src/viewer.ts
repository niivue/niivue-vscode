import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';

export class NiivueWidget extends Widget {
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  private _iframe: HTMLIFrameElement;

  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    super();
    this._context = context;
    this.addClass('jp-NiivueWidget');

    this._iframe = document.createElement('iframe');
    this._iframe.style.width = '100%';
    this._iframe.style.height = '100%';
    this._iframe.style.border = 'none';
    this.node.appendChild(this._iframe);

    this._initializeViewer();
  }

  private _initializeViewer(): void {
    try {
      const filePath = this._context.path;
      console.log('Initializing Niivue viewer for file:', filePath);

      const html = this._getHtmlForViewer();
      
      // Write HTML to iframe
      this._iframe.srcdoc = html;
      
      // Set up message passing
      this._iframe.onload = () => {
        this._sendAddImageMessage(filePath);
      };

      console.log('Niivue viewer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Niivue viewer:', error);
      this._showError(`Failed to initialize viewer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private _getHtmlForViewer(): string {
    // Use the static file handler we set up in handlers.py
    const scriptPath = `/lab/extensions/jupyterlab-niivue/static/niivue/build/assets/index.js`;
    const cssPath = `/lab/extensions/jupyterlab-niivue/static/niivue/build/assets/index.css`;
    
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
          </html>`;
  }

  private _sendAddImageMessage(filePath: string): void {
    if (this._iframe.contentWindow) {
      // Send the addImage message to load the file
      this._iframe.contentWindow.postMessage({
        type: 'addImage',
        body: {
          uri: filePath,
        },
      }, '*');
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
    // Resize is handled by the iframe content
    console.log('Widget resized');
  }

  dispose(): void {
    // Cleanup iframe
    if (this._iframe) {
      this._iframe.remove();
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