import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the niivue-juypterlab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'niivue-juypterlab:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension niivue-juypterlab is activated!');
  }
};

export default plugin;
