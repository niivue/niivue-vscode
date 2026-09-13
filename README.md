# NiiVue VS Code (and Jupyterlab, web native, streamlit)

[![Coverage](https://img.shields.io/endpoint?url=https://niivue.github.io/niivue-vscode/coverage/main/badge.json)](https://niivue.github.io/niivue-vscode/coverage/main/)

**WebGPU/WebGL2 medical image viewers for multiple platforms**

This monorepo contains the [NiiVue](https://github.com/niivue/niivue) integration projects for VS Code, JupyterLab, web browsers, and Streamlit. View NIfTI files, meshes, tractography, and DICOM images with hardware-accelerated rendering across your favorite development environments.

In every viewer, the **Screenshot** button in the menu bar saves the visible tiles as a PNG figure.

## Projects

### VS Code Extension (Main Project)

View neuroimaging files directly in Visual Studio Code. Works seamlessly in remote sessions (SSH, WSL, containers) - especially useful for analyzing data on clusters and servers.

- **Install**: Search for "niivue" in VS Code Extensions
- **Release**: [Marketplace - Release Page and Docs](https://marketplace.visualstudio.com/items?itemName=KorbinianEckstein.niivue)
- **Usage**: Open image files like code files, or select multiple and right click -> `NiiVue: Compare`

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

- **Try it**: [https://niivue.github.io/niivue-vscode](https://niivue.github.io/niivue-vscode)
- **Install**: Click "Install App" in Chrome/Edge
- **Docs**: [apps/pwa/README.md](apps/pwa/README.md)

### Streamlit Component (_experimental_)

Embed NiiVue viewer in Streamlit data apps.

- **Install**: `pip install niivue-streamlit`
- **Docs**: [apps/streamlit/README.md](apps/streamlit/README.md)

```python
# Quick start
from pathlib import Path
from niivue_component import niivue_viewer

niivue_viewer(nifti_data=Path("brain.nii.gz").read_bytes(), filename="brain.nii.gz")
```

### Desktop App (_new_)

Standalone desktop viewer for Linux, macOS and Windows, built with [Tauri](https://tauri.app/). Opens images from the local file system through a native file dialog.

- **Build**: from source with `pnpm --filter @niivue/tauri build` (requires Rust)
- **Docs**: [apps/desktop-tauri/README.md](apps/desktop-tauri/README.md)

## Supported Formats

- **Voxel-based**: NIfTI (.nii, .nii.gz), NRRD, MRtrix MIF, AFNI, MGH/MGZ, ITK MHD, ECAT7, MINC, BrainVoyager, DICOM, NumPy (.npy, .npz)
- **Mesh-based**: GIfTI, FreeSurfer, MZ3, STL, OBJ, PLY, VTK, X3D, and many others
- **Mesh Overlays**: GIfTI, CIfTI-2, MZ3, FreeSurfer (CURV, ANNOT), SMP, STC
- **Tractography**: TCK, TRK, TRX, VTK, AFNI
- **Graphs**: GraphML (.graphml) node/edge graphs, shown as a connectome

## Keyboard Shortcuts

NiiVue supports comprehensive keyboard shortcuts for efficient navigation and control. All shortcuts are shown in menus and button tooltips.

### Core NiiVue Shortcuts (Built-in)

These are NiiVue's default keys and work across all platforms:

**Mouse Controls:**

- **Right Mouse**: Adjust contrast/brightness (windowing); with Zoom button pressed: drag to zoom
- **Middle Mouse**: Drag to pan
- **Mouse Scroll**: Change slice
- **Shift + Mouse**: 2D dragging and 3D viewplane rotation

**Navigation:**

- **← →**: Change volume in 4D images
- **V**: Cycle through view modes
- **C**: Cycle through clip plane orientations in 3D

**Crosshair Movement:**

- **H/L**: Move crosshair Left/Right
- **J/K**: Move crosshair Posterior/Anterior
- **Ctrl+U/Ctrl+D**: Move crosshair Superior/Inferior
- **Shift+U/Shift+D**: Move crosshair Superior/Inferior (browser-friendly alternative; Ctrl+U/D is intercepted by browsers in PWA)

### UI Shortcuts (Customizable in VSCode)

These shortcuts control the viewer interface and can be customized in VSCode settings:

**View Modes:**

- **1**: Axial view
- **2**: Sagittal view
- **3**: Coronal view
- **4**: Render view
- **5**: Multiplanar + Render view
- **R**: Reset view/zoom

**Toggles:**

- **I**: Toggle interpolation
- **B**: Toggle colorbar
- **X**: Toggle radiological convention
- **M**: Toggle crosshair
- **Z**: Toggle zoom drag mode
- **U**: Cycle UI visibility (Show All → Hide UI → Hide All)

**Actions:**

- **Ctrl+Shift+O** (Cmd+Shift+O on Mac): Add image
- **Ctrl+L** (Cmd+L on Mac): Add overlay
- **S**: Open colorscale menu
- **Ctrl+Shift+H** (Cmd+Shift+H on Mac): Show header information

> **Note**: In VSCode, you can customize any of the UI shortcuts by opening the Keyboard Shortcuts editor (File → Preferences → Keyboard Shortcuts) and searching for "NiiVue".

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

## Citation

If you use the VS Code extension, the JupyterLab extension, the web app or the Streamlit component in published work, please cite:

> Eckstein K, Androulakis A, Dao TT, Drake C, Hanayik T, O'Reilly C, Prahm C, Wang Z, Wighton P, Dalca A, Bollmann S, Rorden C. Seamless neuroimaging visualization: The NiiVue wrapper ecosystem. _Aperture Neuro_. 2026;6. [doi:10.52294/001c.167815](https://doi.org/10.52294/001c.167815)

<details>
<summary>BibTeX</summary>

```bibtex
@article{eckstein2026niivue,
  title   = {Seamless neuroimaging visualization: The {NiiVue} wrapper ecosystem},
  author  = {Eckstein, Korbinian and Androulakis, Anthony and Dao, Thuy T. and Drake, Chris and Hanayik, Taylor and O'Reilly, Christian and Prahm, Cosima and Wang, Zhengjia and Wighton, Paul and Dalca, Adrian and Bollmann, Steffen and Rorden, Chris},
  journal = {Aperture Neuro},
  volume  = {6},
  year    = {2026},
  doi     = {10.52294/001c.167815}
}
```

</details>

## Support This Project

If you find these tools useful, please consider supporting development:

<a href="https://opencollective.com/niivue/projects/niivue-vscode/donate" target="_blank">
  <img src="https://opencollective.com/niivue/donate/button@2x.png?color=blue" width="250" />
</a>

## License

BSD-2-Clause

## Credits

- Built with [NiiVue](https://github.com/niivue/niivue)
- Initial development at the Neurodesk team. [Neurodesk](https://neurodesk.org/) is a flexible and scalable data analysis environment for reproducible neuroimaging

## Links

- [NiiVue Core Library](https://github.com/niivue/niivue)
- [NiiVue Web Demo](https://niivue.github.io/niivue/)
- [Report Issues](https://github.com/niivue/niivue-vscode/issues)
