import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';


import { NiivueViewer } from './viewer';

const FACTORY_NAME = 'Niivue Viewer';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-niivue:plugin',
  description: 'A JupyterLab extension for viewing NIfTI files with Niivue',
  autoStart: true,
  requires: [],
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-niivue is activated!');

    const factory = new NiivueViewer.Factory({
      name: FACTORY_NAME,
      fileTypes: ['nii', 'nii.gz'],
      defaultFor: ['nii', 'nii.gz'],
      modelName: 'base64'
    });

    factory.widgetCreated.connect((sender, widget) => {
      console.log('Niivue widget created:', widget);
      // widget.title.icon = 'jp-MaterialIcon jp-ImageIcon';
      widget.context.pathChanged.connect(() => {
        widget.title.label = widget.context.localPath.split('/').pop() || '';
      });
    });

    app.docRegistry.addWidgetFactory(factory);

    app.docRegistry.addFileType({
      name: 'nii',
      displayName: 'NIfTI File',
      extensions: ['.nii'],
      mimeTypes: ['application/x-nifti'],
      iconClass: 'jp-MaterialIcon jp-ImageIcon'
    });

    app.docRegistry.addFileType({
      name: 'nii.gz',
      displayName: 'Compressed NIfTI File',
      extensions: ['.nii.gz'],
      mimeTypes: ['application/x-nifti-gz'],
      iconClass: 'jp-MaterialIcon jp-ImageIcon'
    });
  }
};

export default plugin;