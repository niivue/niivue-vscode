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
2. **File Picker**: Click "Add Image" to browse and select files
3. **Example Images**: Try the built-in example images to get started
4. **URL Parameters**: Open files by URL with a comma-separated `images` list (e.g., `?images=https://niivue.github.io/niivue-demo-images/mni152.nii.gz`)

### Saving and Opening Scenes

**NVDocument** in the menu bar downloads the selected tile as a NiiVue scene document: its images with their display settings and the view. **Save** writes a `.nvd` file, **Save as JSON** a readable `.nvd.json`. Open a scene again with **NVDocument > Load**, by dropping the file, through the `images` URL parameter, or, in the installed app, by opening a `.nvd` file with NiiVue.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1/2/3` | Axial/sagittal/coronal view |
| `4` | Render view |
| `5` | Multiplanar + render view |
| `6` | Multiplanar + timeseries view |
| `V` | Cycle through view modes |
| `C` | Cycle through clip plane orientations in 3D |
| `R` | Reset view/zoom |
| `←/→` | Previous/next volume in 4D images |
| `H/L` | Move crosshair left/right |
| `J/K` | Move crosshair posterior/anterior |
| `Shift+U/Shift+D` | Move crosshair superior/inferior |
| `I` | Toggle interpolation |
| `B` | Toggle colorbar |
| `X` | Toggle radiological convention |
| `M` | Toggle crosshair |
| `Z` | Toggle zoom drag mode |
| `U` | Cycle UI visibility |
| `S` | Open colorscale menu |
| `Ctrl+Shift+O` | Add image |
| `Ctrl+L` | Add overlay |
| `Ctrl+Shift+H` | Show header information |

In the 3D render view, `H/L` and `J/K` rotate the camera instead. On macOS, `Cmd` works in place of `Ctrl`.

### Supported File Formats

#### Voxel-Based Formats
- **NIfTI**: `.nii`, `.nii.gz`
- **DICOM**: `.dcm`, `.dicom`
- **NRRD**: `.nrrd`, `.nhdr`
- **MGH/MGZ**: `.mgh`, `.mgz`
- **MHA/MHD**: `.mha`, `.mhd`
- **BrainVoyager**: `.vmr`, `.v16`
- **ECAT7**: `.v`
- **MINC**: `.mnc`, `.mnc.gz`
- **NumPy**: `.npy`, `.npz` *(experimental)*

#### Surface/Mesh Formats
- **GIfTI**: `.gii`
- **FreeSurfer**: `.pial`, `.inflated`, `.white`, `.orig`, `.smoothwm`
- **MZ3**: `.mz3`
- **Legacy Formats**: `.asc`, `.obj`, `.stl`, `.vtk`, `.ply`, `.off`, `.gii.gz`

#### Tractography
- **TrackVis**: `.trk`
- **MRtrix**: `.tck`
- **TRX**: `.trx`

#### Graphs
- **GraphML**: `.graphml` (node/edge graphs, shown as a connectome)

## Troubleshooting

### Images stay blank

The viewer renders with WebGPU when the browser offers it and with WebGL2 otherwise. Some browsers advertise WebGPU but cannot render with it (for example with a blocklisted GPU or a driver problem), which leaves the canvas empty. Force WebGL2 by adding `?backend=webgl2` to the address:

```
https://niivue.github.io/niivue-vscode/?backend=webgl2
```

It combines with other parameters, e.g. `?backend=webgl2&images=<url>`. `?backend=webgpu` forces WebGPU.

## Privacy & Security

- **No Data Collection**: All processing happens locally in your browser
- **No Server Upload**: Files never leave your device
- **Open Source**: Fully transparent codebase

## Development

Want to contribute or run locally? See [DEVELOPMENT.md](DEVELOPMENT.md).

### PR Preview Deployments

When you open a pull request that modifies the PWA, a preview deployment is automatically created and deployed to GitHub Pages. This allows you to:

- **Test Changes**: View and test your changes in a production-like environment
- **Debug Issues**: Share a live URL with reviewers for debugging
- **Validate UI**: See exactly how your changes will look when deployed

**Preview URL format:** `https://niivue.github.io/niivue-vscode/pr-{NUMBER}/`

A comment will be automatically posted on your PR with the preview URL once the deployment completes. The preview is updated automatically when you push new commits, and cleaned up when the PR is closed.

## Related Projects

- **VS Code Extension**: [NiiVue for VS Code](https://marketplace.visualstudio.com/items?itemName=KorbinianEckstein.niivue)
- **JupyterLab Extension**: [jupyterlab-niivue](https://pypi.org/project/jupyterlab-niivue/)
- **NiiVue Core**: [github.com/niivue/niivue](https://github.com/niivue/niivue)

## Support

- **Bug Reports**: [GitHub Issues](https://github.com/niivue/niivue-vscode/issues)
- **Questions**: [GitHub Issues](https://github.com/niivue/niivue-vscode/issues)
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
