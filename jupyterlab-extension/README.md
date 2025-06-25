# NiiVue JupyterLab Extension

A JupyterLab extension for viewing medical images using the powerful [NiiVue](https://github.com/niivue/niivue) WebGL 2.0 viewer.

## Features

- **Multi-format support**: View NIfTI, DICOM, and many other medical imaging formats
- **3D visualization**: Interactive 3D rendering with crosshairs and overlays
- **High performance**: WebGL 2.0 powered visualization
- **JupyterLab integration**: Seamless integration with JupyterLab's file browser and interface
- **Shared codebase**: Built alongside the VS Code extension for consistency

## Supported Formats

- NIfTI (`.nii`, `.nii.gz`)
- DICOM (`.dcm`)
- MGH/MGZ (`.mgh`, `.mgz`)
- NRRD (`.nrrd`, `.nhdr`)
- MHA/MHD (`.mha`, `.mhd`)
- MIF (`.mif`, `.mif.gz`)
- BrainVoyager (`.v`, `.v16`, `.vmr`)
- GIfTI (`.gii`)
- MZ3 (`.mz3`)

## Installation

### From PyPI (when published)
```bash
pip install niivue-jupyterlab
```

### Development Installation

1. Clone this repository
2. Navigate to the project directory
3. Run the development setup:
   ```bash
   python setup-dev.py
   ```

Or manually:
```bash
# Install Python package in development mode
pip install -e .

# Install Node.js dependencies
cd jupyterlab-extension
yarn install

# Build and install the extension
yarn build
jupyter labextension develop . --overwrite

# Enable the extension
jupyter labextension list
```

## Development

### Prerequisites
- Python 3.8+
- Node.js 18+
- JupyterLab 4.0+

### Development Workflow

1. **Start the development watcher:**
   ```bash
   cd jupyterlab-extension
   yarn watch
   ```

2. **In another terminal, start JupyterLab:**
   ```bash
   jupyter lab
   ```

3. **Make changes and refresh JupyterLab** to see updates

### Project Structure

```
jupyterlab-extension/
├── package.json          # Extension configuration
├── tsconfig.json         # TypeScript configuration  
├── src/
│   ├── index.ts          # Main extension entry point
│   ├── factory.ts        # Widget factory
│   ├── widget.ts         # Main viewer widget
│   └── ...
├── style/                # CSS styles
└── ...

niivue_jupyterlab/        # Python package
├── __init__.py
└── ...

shared/                   # Shared utilities
└── types.ts             # Common types and constants
```

### Architecture

The extension follows JupyterLab's standard patterns:

- **Extension Plugin**: Registers the extension with JupyterLab
- **Widget Factory**: Creates viewer widgets for supported file types
- **Document Widget**: Contains the NiiVue viewer and handles file loading
- **Shared Code**: Utilities shared between VS Code and JupyterLab extensions

## Usage

1. **Open JupyterLab**
2. **Navigate to a medical image file** in the file browser
3. **Double-click the file** or right-click and select "Open with NiiVue"
4. **Interact with the 3D viewer**:
   - Drag to rotate
   - Scroll to change slices
   - Use keyboard shortcuts for navigation

## Contributing

This extension is part of the larger NiiVue project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the [LICENSE](../LICENSE) file for details.

## Acknowledgments

- [NiiVue](https://github.com/niivue/niivue) - The core medical image viewer
- [JupyterLab](https://github.com/jupyterlab/jupyterlab) - The extensible environment
- The medical imaging and neuroimaging communities
