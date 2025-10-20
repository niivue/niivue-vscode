# NiiVue VS Code (and Jupyterlab, web native, streamlit)

**WebGL 2.0 medical image viewers for multiple platforms**

This monorepo contains the [NiiVue](https://github.com/niivue/niivue) integration projects for VS Code, JupyterLab, web browsers, and Streamlit. View NIfTI files, meshes, tractography, and DICOM images with hardware-accelerated rendering across your favorite development environments.

## Projects

### VS Code Extension (Main Project)

View neuroimaging files directly in Visual Studio Code. Works seamlessly in remote sessions (SSH, WSL, containers) - especially useful for analyzing data on clusters and servers.

- **Install**: Search for "niivue" in VS Code Extensions
- **Release**: [Marketplace - Release Page and Docs](https://marketplace.visualstudio.com/items?itemName=KorbinianEckstein.niivue)
- **Usage**: Open image files like code files, or select multiple and right click -> `Niivue: Compare`

```bash
# Or via terminal
code myimage.nii.gz
```

### JupyterLab Extension

Native neuroimaging viewer for JupyterLab notebooks.

- **Install**: `pip install jupyterlab-niivue`
- **Release**: [PyPI - Release Page and Docs](https://pypi.org/project/jupyterlab-niivue/)

```bash
# Quick start
pip install jupyterlab-niivue
jupyter lab
# Double-click any .nii file in JupyterLab
```

### Progressive Web App

Browser-based viewer that works offline as an installable web app.

- **Try it**: [https://korbinian90.github.io/niivue-vscode](https://korbinian90.github.io/niivue-vscode)
- **Install**: Click "Install App" in Chrome/Edge
- **Docs**: [apps/pwa/README.md](apps/pwa/README.md)

### Streamlit Component (*experimental*)

Embed NiiVue viewer in Streamlit data apps.

- **Install**: `pip install --index-url https://test.pypi.org/simple/ --no-deps niivue-streamlit`
- **Docs**: [apps/streamlit/README.md](apps/streamlit/README.md)

```python
# Quick start
import streamlit as st
from niivue_component import niivue_component

niivue_component(images=["brain.nii.gz"])
```

## Supported Formats

- **Voxel-based**: NIfTI (.nii, .nii.gz), NRRD, MRtrix MIF, AFNI, MGH/MGZ, ITK MHD, ECAT7, DICOM, NumPy (.npy, .npz)
- **Mesh-based**: GIfTI, FreeSurfer, MZ3, STL, OBJ, PLY, VTK, X3D, and many others
- **Mesh Overlays**: GIfTI, CIfTI-2, MZ3, FreeSurfer (CURV, ANNOT), SMP, STC
- **Tractography**: TCK, TRK, TRX, VTK, AFNI

## Keyboard Shortcuts

### Mouse Controls
- **Right Mouse**: Adjust contrast/brightness (windowing); with Zoom button pressed: drag to zoom
- **Middle Mouse**: Drag to pan
- **Mouse Scroll**: Change slice
- **Shift + Mouse**: 2D dragging and 3D viewplane rotation

### Navigation
- **← →**: Change volume in 4D images
- **V**: Cycle through view modes
- **C**: Cycle through clip plane orientations in 3D

### Crosshair Movement
- **H/L**: Move crosshair Right/Left
- **J/K**: Move crosshair Posterior/Anterior
- **Ctrl+U/Ctrl+D**: Move crosshair Superior/Inferior

## Development

This is a Turborepo monorepo using pnpm for package management.

```bash
# Install dependencies
pnpm install

# Build all projects
pnpm build

# Start development mode
pnpm dev

# Run tests
pnpm test
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.

## Support This Project

If you find these tools useful, please consider supporting development:

[![Donate](https://opencollective.com/webpack/donate/button@2x.png?color=blue)](https://opencollective.com/niivue/projects/niivue-vscode/donate)

## License

BSD-2-Clause

## Credits

- Built with [NiiVue](https://github.com/niivue/niivue)
- Initial development at the Neurodesk team. [Neurodesk](https://neurodesk.org/) is a flexible and scalable data analysis environment for reproducible neuroimaging

## Links

- [NiiVue Core Library](https://github.com/niivue/niivue)
- [NiiVue Web Demo](https://niivue.github.io/niivue/)
- [Report Issues](https://github.com/niivue/niivue-vscode/issues)
