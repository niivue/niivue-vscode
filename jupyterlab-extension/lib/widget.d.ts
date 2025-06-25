import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
/**
 * A widget for displaying NiiVue medical image viewer content.
 */
declare class NiiVueWidget extends Widget {
    private _niivue;
    private _canvas;
    private _context;
    constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>);
    /**
     * Handle after-attach messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle resize messages for the widget.
     */
    protected onResize(msg: Widget.ResizeMessage): void;
    /**
     * Initialize the NiiVue viewer.
     */
    private _initializeNiiVue;
    /**
     * Load the medical image file.
     */
    private _loadFile;
    /**
     * Show an error message in the widget.
     */
    private _showError;
    /**
     * Dispose of the widget.
     */
    dispose(): void;
}
/**
 * A document widget for viewing medical images with NiiVue.
 */
export declare class NiiVueDocumentWidget extends DocumentWidget<NiiVueWidget, DocumentRegistry.IModel> {
    constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>);
    /**
     * Handle URI fragment changes.
     */
    setFragment(fragment: string): void;
}
export {};
