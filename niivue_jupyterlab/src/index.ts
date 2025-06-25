import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the niivue-jupyterlab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'niivue-jupyterlab:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension niivue-jupyterlab is activated!');
  }
};

export default plugin;
