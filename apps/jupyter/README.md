# JupyterLab NiiVue

**WebGL 2.0 medical image viewer for JupyterLab**

A JupyterLab extension that uses [NiiVue](https://github.com/niivue/niivue) to display neuroimaging files directly in JupyterLab. View NIfTI files, meshes, tractography, and DICOM images with an interactive, hardware-accelerated viewer integrated into your JupyterLab environment.

## Installation

Install the extension using pip:

```bash
pip install jupyterlab-niivue
```

## Usage

### Opening Files

1. **File Browser**: Simply double-click any supported neuroimaging file in the JupyterLab file browser
2. **Right-click Menu**: Right-click on a file and select "Open With" → "NiiVue Viewer"
3. **Compare Multiple Files**: Select multiple files (2 or more), right-click, and choose "Compare in NiiVue" to view them side-by-side in a multi-panel layout

## Screenshots

![Default view showing a brain volume opened in JupyterLab with the NiiVue viewer](https://raw.githubusercontent.com/niivue/niivue-vscode/main/apps/jupyter/media/screenshot_default_view.png)

![Multiple images opened in compare view](https://raw.githubusercontent.com/niivue/niivue-vscode/main/apps/jupyter/media/screenshot_compare_view.png)

## Keyboard Shortcuts

### Mouse Controls
- **Right Mouse**: Drag to adjust contrast/brightness (windowing); when Zoom button is pressed, drag to zoom
- **Middle Mouse**: Drag to pan
- **Mouse Scroll**: Change slice in currently hovered image
- **Shift + Mouse**: 2D dragging and 3D viewplane rotation

### Navigation
- **← →**: Change volume in 4D image
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

NiiVue can open several formats popular with brain imaging:

- **Voxel-based**: [NIfTI](https://brainder.org/2012/09/23/the-nifti-file-format/) (.nii, .nii.gz), [NRRD](http://teem.sourceforge.net/nrrd/format.html) (.nrrd, .nhdr), [MRtrix MIF](https://mrtrix.readthedocs.io/en/latest/getting_started/image_data.html#mrtrix-image-formats) (.mif), [AFNI HEAD/BRIK](https://afni.nimh.nih.gov/pub/dist/doc/program_help/README.attributes.html), [MGH/MGZ](https://surfer.nmr.mgh.harvard.edu/fswiki/FsTutorial/MghFormat), [ITK MHD](https://itk.org/Wiki/ITK/MetaIO/Documentation) (.mhd, .mha), [ECAT7](https://github.com/openneuropet/PET2BIDS/tree/28aae3fab22309047d36d867c624cd629c921ca6/ecat_validation/ecat_info) (.v), [DICOM](https://dicom.nema.org/medical/dicom/current/output/chtml/part10/chapter_7.html) (.dcm), NumPy (.npy, .npz)
- **Mesh-based**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [FreeSurfer](http://www.grahamwideman.com/gw/brain/fs/surfacefileformats.htm) (pial, white, inflated), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), [STL](https://medium.com/3d-printing-stories/why-stl-format-is-bad-fea9ecf5e45) (.stl), [Wavefront OBJ](https://brainder.org/tag/obj/) (.obj), [PLY](<https://en.wikipedia.org/wiki/PLY_(file_format)>) (.ply), [BrainSuite DFS](http://brainsuite.org/formats/dfs/) (.dfs), [Legacy VTK](https://vtk.org/wp-content/uploads/2015/04/file-formats.pdf) (.vtk), [X3D](https://3dprint.nih.gov/) (.x3d), and others (ASC, BYU, GEO, ICO, TRI, OFF, SRF, NV)
- **Mesh Overlays**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [CIfTI-2](https://balsa.wustl.edu/about/fileTypes) (.nii), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), FreeSurfer (CURV, ANNOT), SMP, STC
- **Tractography**: [TCK](https://mrtrix.readthedocs.io/en/latest/getting_started/image_data.html#tracks-file-format-tck) (.tck), [TRK](http://trackvis.org/docs/?subsect=fileformat) (.trk), [TRX](https://github.com/frheault/tractography_file_format) (.trx), VTK (.vtk), AFNI (.niml.tract)

## Requirements

- JupyterLab >= 4.0.0
- A modern web browser with WebGL 2.0 support (Chrome, Firefox, Edge, Safari)

## Troubleshooting

### Extension not appearing
If the extension doesn't appear after installation, try:

```bash
jupyter labextension list
```

You should see `jupyterlab-niivue` in the list. If not, try rebuilding JupyterLab:

```bash
jupyter lab build
```

### Files not opening
If files don't open when double-clicked:
1. Check that the file format is supported (see list above)
2. Try right-clicking the file and selecting "Open With" → "NiiVue Viewer"
3. Check the browser console for any error messages

## Development

This extension is part of the [NiiVue monorepo](https://github.com/niivue/niivue-vscode). Contributions are welcome!

If you encounter issues or have feature requests, please [open an issue on GitHub](https://github.com/niivue/niivue-vscode/issues).

## Support This Project

If you find this extension useful, please consider supporting its development through a financial contribution:

<a href="https://opencollective.com/niivue/projects/niivue-vscode/donate" target="_blank">
  <img src="https://opencollective.com/niivue/donate/button@2x.png?color=blue" width="250" />
</a>

## License

BSD-2-Clause

## Credits

- Built with [NiiVue](https://github.com/niivue/niivue)
- Part of [Neurodesk](https://neurodesk.org/), a flexible and scalable data analysis environment for reproducible neuroimaging
- Part of the NiiVue ecosystem for neuroimaging visualization

## Related Projects

- [NiiVue VS Code Extension](https://marketplace.visualstudio.com/items?itemName=KorbinianEckstein.niivue) - NiiVue for Visual Studio Code
- [NiiVue](https://github.com/niivue/niivue) - The core NiiVue library
- [NiiVue Web App](https://niivue.github.io/niivue/) - Online NiiVue viewer
