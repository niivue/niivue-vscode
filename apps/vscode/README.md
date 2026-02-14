# NiiVue for VS Code

**WebGL 2.0 medical image viewer for Visual Studio Code**

A VS Code extension that uses [NiiVue](https://github.com/niivue/niivue) to display neuroimaging files directly in VS Code. View NIfTI files, meshes, tractography, and DICOM images with an interactive, hardware-accelerated viewer. Works seamlessly in remote sessions (SSH, WSL, containers) - especially useful for analyzing data on clusters and servers.

## Installation

Install from the VS Code Marketplace:

1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search for "niivue" and install

Or install from the command line:

```bash
code --install-extension KorbinianEckstein.niivue
```

## Usage

### Opening Files

1. **Explorer**: Simply click any supported neuroimaging file in the VS Code Explorer
2. **Compare Multiple Files**: Select multiple files in Explorer, right-click → "NiiVue: Compare"
4. **Add Overlays**: Click the Overlay menu

### View Presets

NiiVue includes optimized viewing presets for different types of neuroimaging data:

- **fMRI**: Optimized for functional MRI with 4D timeseries visualization, including multiplanar view with automatic timeseries display
- **Phase Data**: Configured for phase images with interpolation disabled and full phase range scaling (-π to π)
- **Anatomical**: Standard settings for anatomical T1/T2 images with gray colormap
- **DTI/Diffusion**: Optimized for diffusion tensor imaging overlays with jet colormap

**Using Presets:**
1. Open an image file in NiiVue
2. Click the **Presets** menu in the viewer
3. Select a preset to apply

**Custom Presets:**
- Save your current view settings as a custom preset using "Save Current as Preset"
- Custom presets are stored in VSCode settings and persist across sessions
- Delete custom presets by clicking the ✕ button next to their name

### Remote Development

NiiVue works with VS Code's remote development features:
- **SSH**: View images on remote servers without downloading
- **WSL**: Access Windows Subsystem for Linux files
- **Containers**: Work with images inside Docker containers
- **Codespaces**: Use in GitHub Codespaces environments
- **Web Version**: Works in [vscode.dev](https://vscode.dev) and [github.dev](https://github.dev)


## Screenshots

![Default view showing brain imaging in VS Code](https://raw.githubusercontent.com/niivue/niivue-vscode/main/apps/vscode/media/default_view.png)

![Comparing multiple images side-by-side](https://raw.githubusercontent.com/niivue/niivue-vscode/main/apps/vscode/media/compare_view.png)

![NiiVue in web-based VS Code](https://raw.githubusercontent.com/niivue/niivue-vscode/main/apps/vscode/media/web_based.png)

## Keyboard Shortcuts

### Mouse Controls
- **Right Mouse**: Adjust contrast/brightness (windowing); with Zoom button pressed: drag to zoom
- **Middle Mouse**: Drag to pan
- **Mouse Scroll**: Change slice in currently hovered image
- **Shift + Mouse**: 2D dragging and 3D viewplane rotation

### Navigation
- **← →**: Change volume in 4D images
- **V**: Cycle through view modes
- **C**: Cycle through clip plane orientations in 3D render

### Crosshair Movement
- **H**: Move crosshair to R (Right)
- **L**: Move crosshair to L (Left)
- **J**: Move crosshair to P (Posterior)
- **K**: Move crosshair to A (Anterior)
- **Ctrl+U**: Move crosshair to S (Superior)
- **Ctrl+D**: Move crosshair to I (Inferior)

## Supported Formats

- **Voxel-based**: [NIfTI](https://brainder.org/2012/09/23/the-nifti-file-format/) (.nii, .nii.gz), [NRRD](http://teem.sourceforge.net/nrrd/format.html) (.nrrd, .nhdr), [MRtrix MIF](https://mrtrix.readthedocs.io/en/latest/getting_started/image_data.html#mrtrix-image-formats) (.mif), [AFNI HEAD/BRIK](https://afni.nimh.nih.gov/pub/dist/doc/program_help/README.attributes.html), [MGH/MGZ](https://surfer.nmr.mgh.harvard.edu/fswiki/FsTutorial/MghFormat), [ITK MHD](https://itk.org/Wiki/ITK/MetaIO/Documentation) (.mhd, .mha), [ECAT7](https://github.com/openneuropet/PET2BIDS/tree/28aae3fab22309047d36d867c624cd629c921ca6/ecat_validation/ecat_info) (.v), [DICOM](https://dicom.nema.org/medical/dicom/current/output/chtml/part10/chapter_7.html) (.dcm)
- **Mesh-based**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [FreeSurfer](http://www.grahamwideman.com/gw/brain/fs/surfacefileformats.htm) (pial, white, inflated), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), [STL](https://medium.com/3d-printing-stories/why-stl-format-is-bad-fea9ecf5e45) (.stl), [Wavefront OBJ](https://brainder.org/tag/obj/) (.obj), [PLY](<https://en.wikipedia.org/wiki/PLY_(file_format)>) (.ply), [BrainSuite DFS](http://brainsuite.org/formats/dfs/) (.dfs), [Legacy VTK](https://vtk.org/wp-content/uploads/2015/04/file-formats.pdf) (.vtk), [X3D](https://3dprint.nih.gov/) (.x3d), and others (ASC, BYU, GEO, ICO, TRI, OFF, SRF, NV)
- **Mesh Overlays**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [CIfTI-2](https://balsa.wustl.edu/about/fileTypes) (.nii), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), FreeSurfer (CURV, ANNOT), SMP, STC
- **Tractography**: [TCK](https://mrtrix.readthedocs.io/en/latest/getting_started/image_data.html#tracks-file-format-tck) (.tck), [TRK](http://trackvis.org/docs/?subsect=fileformat) (.trk), [TRX](https://github.com/frheault/tractography_file_format) (.trx), VTK (.vtk), AFNI (.niml.tract)

## Web Version

A standalone [web version](https://korbinian90.github.io/niivue-vscode) is also available that can be installed as a Progressive Web App with file associations (Chrome/Edge only).

## Development

This extension is part of the [niivue-vscode monorepo](https://github.com/niivue/niivue-vscode). Contributions are welcome!

For development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

If you encounter issues or have feature requests, please [open an issue on GitHub](https://github.com/niivue/niivue-vscode/issues).

## Support This Project

If you find this extension useful, please consider supporting its development:

<a href="https://opencollective.com/niivue/projects/niivue-vscode/donate" target="_blank">
  <img src="https://opencollective.com/niivue/donate/button@2x.png?color=blue" width="250" />
</a>

## License

BSD-2-Clause

## Credits

- Built with [NiiVue](https://github.com/niivue/niivue)
- Initial development at the Neurodesk team. [Neurodesk](https://neurodesk.org/) is a flexible and scalable data analysis environment for reproducible neuroimaging

## Related Projects

- [NiiVue JupyterLab Extension](https://pypi.org/project/jupyterlab-niivue/) - NiiVue for JupyterLab
- [NiiVue](https://github.com/niivue/niivue) - The core NiiVue library
- [NiiVue Web App](https://niivue.github.io/niivue/) - Offline NiiVue viewer
