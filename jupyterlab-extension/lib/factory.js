import { ABCWidgetFactory } from '@jupyterlab/docregistry';
import { NiiVueDocumentWidget } from './widget';
/**
 * A widget factory for NiiVue viewers.
 */
export class NiiVueWidgetFactory extends ABCWidgetFactory {
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        return new NiiVueDocumentWidget(context);
    }
}
//# sourceMappingURL=factory.js.map