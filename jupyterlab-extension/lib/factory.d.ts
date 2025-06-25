import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import { NiiVueDocumentWidget } from './widget';
/**
 * A widget factory for NiiVue viewers.
 */
export declare class NiiVueWidgetFactory extends ABCWidgetFactory<NiiVueDocumentWidget, DocumentRegistry.IModel> {
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): NiiVueDocumentWidget;
}
