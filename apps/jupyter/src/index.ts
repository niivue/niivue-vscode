import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application'
import { IDocumentManager } from '@jupyterlab/docmanager'
import { IFileBrowserFactory } from '@jupyterlab/filebrowser'
import { ITranslator, nullTranslator } from '@jupyterlab/translation'
import { NiivueViewer } from './viewer'

const FACTORY_NAME = 'Niivue Viewer'
const COMPARE_COMMAND_ID = 'jupyterlab-niivue:compare'

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-niivue:plugin',
  description: 'A JupyterLab extension for viewing NIfTI files with Niivue',
  autoStart: true,
  requires: [IDocumentManager, IFileBrowserFactory],
  optional: [ITranslator],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    browserFactory: IFileBrowserFactory,
    translator: ITranslator | null,
  ) => {
    console.log('JupyterLab extension jupyterlab-niivue is activated!')
    const trans = (translator ?? nullTranslator).load('jupyterlab')

    // All supported file types
    const fileTypes = [
      'nii',
      'nii.gz',
      'dcm',
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
      'mnc',
      'npy',
      'npz',
    ]

    const widgetFactory = new NiivueViewer.Factory(
      {
        name: FACTORY_NAME,
        fileTypes: fileTypes,
        defaultFor: fileTypes,
        modelName: 'base64',
      },
      docManager,
    )

    widgetFactory.widgetCreated.connect((_sender: any, widget: any) => {
      console.log('Niivue widget created:', widget)
      // widget.title.icon = 'jp-MaterialIcon jp-ImageIcon';
      widget.context.pathChanged.connect(() => {
        widget.title.label = widget.context.localPath.split('/').pop() || ''
      })
    })

    app.docRegistry.addWidgetFactory(widgetFactory)

    // Add compare command
    app.commands.addCommand(COMPARE_COMMAND_ID, {
      label: trans.__('Compare in NiiVue'),
      caption: trans.__('Open selected images in NiiVue compare view'),
      execute: () => {
        const { tracker } = browserFactory
        const widget = tracker.currentWidget
        if (!widget) {
          return
        }

        const selectedItems = Array.from(widget.selectedItems())
        if (selectedItems.length < 2) {
          console.warn('Please select at least 2 files to compare')
          return
        }

        // Create a compare view widget
        NiivueViewer.createCompareView(app, docManager, selectedItems)
      },
      isVisible: () => {
        const { tracker } = browserFactory
        const widget = tracker.currentWidget
        if (!widget) {
          return false
        }

        const selectedItems = Array.from(widget.selectedItems())
        // Only show if multiple files are selected and they are all supported types
        return (
          selectedItems.length >= 2 &&
          selectedItems.every((item: any) => {
            const ext = item.name.toLowerCase()
            return fileTypes.some((type) => ext.endsWith(`.${type}`))
          })
        )
      },
    })

    // Add context menu item
    app.contextMenu.addItem({
      command: COMPARE_COMMAND_ID,
      selector: '.jp-DirListing-item[data-isdir="false"]',
      rank: 3,
    })

    // Register all file types
    const fileTypeConfigs = [
      {
        name: 'nii',
        displayName: 'NIfTI File',
        extensions: ['.nii'],
        mimeTypes: ['application/x-nifti'],
      },
      {
        name: 'nii.gz',
        displayName: 'Compressed NIfTI File',
        extensions: ['.nii.gz'],
        mimeTypes: ['application/x-nifti-gz'],
      },
      {
        name: 'dcm',
        displayName: 'DICOM File',
        extensions: ['.dcm'],
        mimeTypes: ['application/dicom'],
      },
      {
        name: 'mih',
        displayName: 'MIH File',
        extensions: ['.mih'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mif',
        displayName: 'MIF File',
        extensions: ['.mif'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mif.gz',
        displayName: 'Compressed MIF File',
        extensions: ['.mif.gz'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'nhdr',
        displayName: 'NRRD Header File',
        extensions: ['.nhdr'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'nrrd',
        displayName: 'NRRD File',
        extensions: ['.nrrd'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mhd',
        displayName: 'MetaImage Header File',
        extensions: ['.mhd'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mha',
        displayName: 'MetaImage File',
        extensions: ['.mha'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mgh',
        displayName: 'MGH File',
        extensions: ['.mgh'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mgz',
        displayName: 'Compressed MGH File',
        extensions: ['.mgz'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'v',
        displayName: 'BrainVoyager V File',
        extensions: ['.v'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'v16',
        displayName: 'BrainVoyager V16 File',
        extensions: ['.v16'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'vmr',
        displayName: 'BrainVoyager VMR File',
        extensions: ['.vmr'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mz3',
        displayName: 'MZ3 Mesh File',
        extensions: ['.mz3'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'gii',
        displayName: 'GIFTI File',
        extensions: ['.gii'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'mnc',
        displayName: 'MINC File',
        extensions: ['.mnc'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'npy',
        displayName: 'NumPy Array File',
        extensions: ['.npy'],
        mimeTypes: ['application/octet-stream'],
      },
      {
        name: 'npz',
        displayName: 'NumPy Compressed Archive',
        extensions: ['.npz'],
        mimeTypes: ['application/octet-stream'],
      },
    ]

    fileTypeConfigs.forEach((config) => {
      app.docRegistry.addFileType({
        name: config.name,
        displayName: config.displayName,
        extensions: config.extensions,
        mimeTypes: config.mimeTypes,
        iconClass: 'jp-Icon jp-NiivueFileIcon',
      })
    })
  },
}

export default plugin
