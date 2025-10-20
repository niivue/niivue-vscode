# NiiVue PWA - Medical Image Viewer

A Progressive Web App for viewing neuroimaging and medical imaging files directly in your browser. Built with NiiVue for fast, offline-capable medical image visualization.

[![Live Demo](https://img.shields.io/badge/demo-live-blue)](https://niivue.github.io/niivue-vscode/)
[![License](https://img.shields.io/badge/license-BSD--2--Clause-green)](LICENSE)

## Features

- **Multiple Format Support**: NIfTI, DICOM, NRRD, MGH/MGZ, and more
- **Progressive Web App**: Install on any device, works offline
- **Rich Visualization**: 3D rendering, multi-planar views, mesh support
- **Keyboard Shortcuts**: Efficient navigation and control
- **No Installation Required**: Run directly in your browser
- **File Association**: Open medical images directly from your file system

## Live Demo

Try it now: **[https://niivue.github.io/niivue-vscode/](https://niivue.github.io/niivue-vscode/)**

## Installation

### As a Web App

Visit the live demo and click "Install" when prompted by your browser to add NiiVue PWA to your home screen or desktop. (Only on Chrome or Edge)

## Usage

### Opening Files

1. **Drag and Drop**: Drop medical image files onto the viewer
2. **File Picker**: Click "Open File" to browse and select files
3. **Example Images**: Try the built-in example images to get started
4. **URL Parameters**: Open specific files via URL (e.g., `?example=mni152.nii.gz`)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `L` | Toggle left panel |
| `R` | Toggle right panel |
| `I` | Toggle image info |
| `V` | Cycle through view modes |
| `C` | Toggle crosshair |
| `B` | Toggle colorbar |
| `1-4` | Switch to specific slice view |
| `M` | Toggle 3D render mode |
| `S` | Save current view as image |
| `←/→` | Navigate slices |
| `+/-` | Zoom in/out |
| `Space` | Reset view |

### Supported File Formats

#### Voxel-Based Formats
- **NIfTI**: `.nii`, `.nii.gz`
- **DICOM**: `.dcm`, `.dicom`
- **NRRD**: `.nrrd`, `.nhdr`
- **MGH/MGZ**: `.mgh`, `.mgz`
- **MHA/MHD**: `.mha`, `.mhd`
- **BrainVoyager**: `.v`, `.vmr`, `.v16`
- **NumPy**: `.npy`, `.npz` *(experimental)*

#### Surface/Mesh Formats
- **GIfTI**: `.gii`
- **FreeSurfer**: `.pial`, `.inflated`, `.white`, `.orig`, `.smoothwm`
- **MZ3**: `.mz3`
- **Legacy Formats**: `.asc`, `.obj`, `.stl`, `.vtk`, `.ply`, `.off`, `.gii.gz`

#### Tractography
- **TrackVis**: `.trk`, `.tck`
- **TCK**: `.tck`

## Privacy & Security

- **No Data Collection**: All processing happens locally in your browser
- **No Server Upload**: Files never leave your device
- **Open Source**: Fully transparent codebase

## Development

Want to contribute or run locally? See [DEVELOPMENT.md](DEVELOPMENT.md).

## Related Projects

- **VS Code Extension**: [NiiVue for VS Code](https://marketplace.visualstudio.com/items?itemName=niivue.vscode)
- **JupyterLab Extension**: [jupyterlab-niivue](https://pypi.org/project/jupyterlab-niivue/)
- **NiiVue Core**: [github.com/niivue/niivue](https://github.com/niivue/niivue)

## Support

- **Bug Reports**: [GitHub Issues](https://github.com/niivue/niivue-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/niivue/niivue-vscode/discussions)
- **Documentation**: [NiiVue Docs](https://niivue.github.io/niivue/)

## Financial Support

If you find NiiVue PWA useful, please consider supporting development:

<a href="https://opencollective.com/niivue/projects/niivue-vscode/donate" target="_blank">
  <img src="https://opencollective.com/niivue/donate/button@2x.png?color=blue" width="250" />
</a>

## License

BSD-2-Clause License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with:
- [NiiVue](https://github.com/niivue/niivue) - WebGL-based medical image visualization
- [Preact](https://preactjs.com/) - Fast 3kB React alternative
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - CSS styling framework
