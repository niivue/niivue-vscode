import { NiiVueWidgetFactory } from './factory';
import '../style/index.css';
/**
 * Supported file formats for NiiVue
 */
const SUPPORTED_FORMATS = [
    'dcm',
    'nii',
    'nii.gz',
    'mih',
    'mif',
    'mif.gz',
    'nhdr',
    'nrrd',
    'mhd',
    'mha',
    'mgh',
    'mgz',
    'v',
    'v16',
    'vmr',
    'mz3',
    'gii',
];
/**
 * The command IDs used by the NiiVue extension.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.open = 'niivue:open';
})(CommandIDs || (CommandIDs = {}));
/**
 * Initialization data for the niivue-jupyterlab extension.
 */
const plugin = {
    id: 'niivue-jupyterlab:plugin',
    description: 'NiiVue medical image viewer for JupyterLab',
    autoStart: true,
    requires: [],
    optional: [],
    activate: (app) => {
        console.log('JupyterLab extension niivue-jupyterlab is activated!');
        const { commands, docRegistry } = app;
        // Create the widget factory
        const factory = new NiiVueWidgetFactory({
            name: 'NiiVue Viewer',
            fileTypes: SUPPORTED_FORMATS,
            defaultFor: SUPPORTED_FORMATS,
            readOnly: true,
        });
        // Register the widget factory
        docRegistry.addWidgetFactory(factory);
        // Register file types
        SUPPORTED_FORMATS.forEach((format) => {
            docRegistry.addFileType({
                name: format,
                extensions: [`.${format}`],
                mimeTypes: ['application/octet-stream'],
                iconClass: 'jp-MaterialIcon jp-ImageIcon',
            });
        });
        // Add commands
        commands.addCommand(CommandIDs.open, {
            label: 'Open with NiiVue',
            caption: 'Open medical image with NiiVue viewer',
            execute: (args) => {
                const path = args.path;
                return commands.execute('docmanager:open', {
                    path,
                    factory: 'NiiVue Viewer',
                });
            },
        });
        console.log('NiiVue extension activated successfully!');
    },
};
export default plugin;
//# sourceMappingURL=index.js.map