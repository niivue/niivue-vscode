# NiiVue Streamlit Component

A modern Streamlit component for visualizing neuroimaging data using NiiVue, built with TypeScript, Preact, and Vite.

## 🚀 Quick Start

### Simple Installation & Usage

1. **Install the component**:

   ```bash
   pip install --index-url https://test.pypi.org/simple/ --no-deps niivue-streamlit
   ```

2. **Use in your Streamlit app**:

   ```python
   import streamlit as st
   from niivue_component import niivue_viewer

   uploaded_file = st.file_uploader("Choose a NIFTI file", type=["nii", "nii.gz"])

   if uploaded_file is not None:
       result = niivue_viewer(
           nifti_data=uploaded_file.getvalue(),
           filename=uploaded_file.name,
           height=700
       )

       # Handle click events
       if result:
           st.write(f"Clicked voxel: {result['voxel']}, Value: {result['value']}")
   ```

## ✨ Features

- 🎨 **Two Component Modes**:
  - `StyledViewer`: Full-featured viewer with interactive menu and controls
  - `UnstyledCanvas`: Minimal canvas-only viewer for embedding
- 🔄 **Multiple View Modes**:
  - Axial, Coronal, Sagittal slices
  - 3D render view
  - Multiplanar view with render
- 📊 **Advanced Capabilities**:
  - Multiple overlay images with custom colormaps
  - Surface mesh rendering (FreeSurfer pial, white, inflated, GIfTI, STL, OBJ, etc.)
  - Mesh overlays (curvature, thickness, annotations)
  - Combined volume + mesh visualization
  - Configurable display settings (crosshair, radiological convention, colorbar, interpolation)
  - Bidirectional communication (click events from viewer to Python)
  - DICOM support

## 📖 Advanced Usage

### With Overlays

```python
from niivue_component import niivue_viewer

result = niivue_viewer(
    nifti_data=main_image_bytes,
    filename="brain.nii.gz",
    overlays=[
        {
            "data": overlay_bytes,
            "name": "activation.nii.gz",
            "colormap": "hot",
            "opacity": 0.7
        }
    ],
    view_mode="multiplanar",
    styled=True,
    settings={
        "crosshair": True,
        "radiological": False,
        "colorbar": True,
        "interpolation": True
    },
    height=800
)
```

### With Mesh Surfaces

```python
from niivue_component import niivue_viewer

# Load a FreeSurfer surface mesh
mesh_data = open("lh.pial", "rb").read()

result = niivue_viewer(
    meshes=[{
        "data": mesh_data,
        "name": "lh.pial",
    }],
    view_mode="3d",
    height=700
)
```

### Mesh with Overlays (Curvature, Thickness)

```python
mesh_data = open("lh.pial", "rb").read()
thickness_data = open("lh.thickness", "rb").read()

result = niivue_viewer(
    meshes=[{
        "data": mesh_data,
        "name": "lh.pial",
        "overlays": [{
            "data": thickness_data,
            "name": "lh.thickness",
            "colormap": "redyell",
            "opacity": 0.7
        }]
    }],
    view_mode="3d",
    height=700
)
```

### Volume with Mesh

```python
# Display a volume image alongside a surface mesh
volume_data = open("brain.nii.gz", "rb").read()
mesh_data = open("lh.pial", "rb").read()

result = niivue_viewer(
    nifti_data=volume_data,
    filename="brain.nii.gz",
    meshes=[{
        "data": mesh_data,
        "name": "lh.pial",
    }],
    view_mode="3d",
    height=700
)
```

### Minimal Viewer (No Menu)

```python
# Perfect for embedding in complex layouts
result = niivue_viewer(
    nifti_data=image_bytes,
    filename="scan.nii",
    styled=False,  # Hide menu
    view_mode="axial",
    height=400
)
```

## ⚡ Performance

Because Streamlit re-runs the whole script whenever a component calls
`Streamlit.setComponentValue`, bidirectional click feedback from the viewer
can become a bottleneck: without care, every mouse event re-reads the file,
re-base64-encodes the NIfTI, and re-transmits it to the iframe. Three knobs
keep the viewer snappy:

1. **`@st.fragment`** — wrap the viewer plus the UI that consumes its
   return value in a fragment. Clicks re-run only the fragment, not the
   whole page. See `app_bidirectional.py`.
2. **`@st.cache_data`** — cache `Path.read_bytes()` (and any other pure
   work) so the same bytes aren't re-loaded on every re-run.
3. **`update_interval_ms`** — controls the throttle on click events sent
   back to Python (default `100` ms). Pass `None` to disable feedback
   entirely when the return value isn't used (e.g. `app_simple.py`,
   `app_overlay.py`, `app_advanced.py`).

Minimal template:

```python
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

@st.cache_data
def load_nifti(path: str) -> bytes:
    return Path(path).read_bytes()

image = load_nifti("brain.nii.gz")

@st.fragment
def viewer():
    result = niivue_viewer(
        nifti_data=image,
        filename="brain.nii.gz",
        key="viewer",
        update_interval_ms=100,  # or None to disable feedback
    )
    if result:
        st.write(result)

viewer()
```

## 📚 API Reference

### `niivue_viewer()`

**Parameters:**

- `nifti_data` (bytes, optional): Raw NIFTI file data
- `filename` (str): Displayed filename
- `overlays` (list[dict], optional): Overlay images list
  - `data` (bytes): Overlay data
  - `name` (str): Overlay name
  - `colormap` (str): Colormap (default: 'red')
  - `opacity` (float): 0-1 (default: 0.5)
- `meshes` (list[dict], optional): Mesh surfaces list
  - `data` (bytes): Mesh file data
  - `name` (str): Mesh filename (must include extension, e.g. 'lh.pial', 'brain.gii')
  - `overlays` (list[dict], optional): Mesh overlays (curvature, thickness, etc.)
    - `data` (bytes): Overlay data
    - `name` (str): Overlay filename
    - `colormap` (str): Colormap (default: 'redyell')
    - `opacity` (float): 0-1 (default: 0.7)
- `height` (int): Height in pixels (default: 600)
- `view_mode` (str): 'axial', 'coronal', 'sagittal', '3d', 'multiplanar' (default)
- `styled` (bool): Show menu (default: True)
- `settings` (dict, optional):
  - `crosshair` (bool): default True
  - `radiological` (bool): default False
  - `colorbar` (bool): default False
  - `interpolation` (bool): default True
- `update_interval_ms` (int or None): throttle for click events sent back to
  Python (default: 100 ms). `None` disables feedback entirely — use it when
  the return value isn't consumed to avoid any Python round-trip during
  mouse interaction.
- `key` (str, optional): Component key

**Returns:**

dict or None with click event data:

- `type`: 'voxel_click'
- `voxel`: [x, y, z]
- `mm`: [x, y, z]
- `value`: float
- `filename`: str

## 🛠️ Development

### Dev mode (live reload)

In dev mode, the Python package points to a local Vite dev server instead of built files.

Terminal 1 — start the frontend dev server (port 3001):

```bash
pnpm dev
```

Terminal 2 — run the example app with the dev flag:

```bash
NIIVUE_DEV=1 streamlit run app.py
```

The frontend hot-reloads on changes.

### Production mode (built files)

Build the frontend first, then run Streamlit normally:

```bash
pnpm build
streamlit run app.py
```

`_RELEASE = True` (the default) serves from `niivue_component/frontend/build/`.

### Running Examples

```bash
# Simple example
streamlit run app.py

# Advanced example with all features
streamlit run app_advanced.py
```

## 📁 Supported Formats

- **Volume-based**: NIFTI (.nii, .nii.gz), DICOM (.dcm), MINC (.mnc, .mnc.gz), MHA/MHD, NRRD, MGH/MGZ
- **Mesh-based**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [FreeSurfer](http://www.grahamwideman.com/gw/brain/fs/surfacefileformats.htm) (pial, white, inflated), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), [STL](https://medium.com/3d-printing-stories/why-stl-format-is-bad-fea9ecf5e45) (.stl), [Wavefront OBJ](https://brainder.org/tag/obj/) (.obj), [PLY](https://en.wikipedia.org/wiki/PLY_%28file_format%29) (.ply), [BrainSuite DFS](http://brainsuite.org/formats/dfs/) (.dfs), [Legacy VTK](https://vtk.org/wp-content/uploads/2015/04/file-formats.pdf) (.vtk)
- **Mesh Overlays**: [GIfTI](https://www.nitrc.org/projects/gifti/) (.gii), [CIfTI-2](https://balsa.wustl.edu/about/fileTypes) (.nii), [MZ3](https://github.com/neurolabusc/surf-ice/tree/master/mz3) (.mz3), FreeSurfer (CURV, ANNOT), SMP, STC
- **Tractography**: [TCK](https://mrtrix.readthedocs.io/en/latest/getting_started/image_data.html#tracks-file-format-tck) (.tck), [TRK](http://trackvis.org/docs/?subsect=fileformat) (.trk), [TRX](https://github.com/frheault/tractography_file_format) (.trx), VTK (.vtk)

## 🏗️ Architecture

```
niivue_component/
├── __init__.py                 # Python API
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StyledViewer.tsx
│   │   │   └── UnstyledCanvas.tsx
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── vite.config.ts
│   └── package.json
└── build/                      # Compiled assets (generated, not in git)
```

## 🔧 Building for Distribution

Build files are not committed to git. To prepare the Python package for release:

```bash
pnpm build
python -m build
```

This compiles frontend assets into `niivue_component/frontend/build/`, which is then bundled into the Python package.

## 📄 License

BSD-2-Clause

## 🙏 Credits

Built on top of:

- [NiiVue](https://github.com/niivue/niivue)
- [Streamlit](https://streamlit.io)
- [niivue-react](../../packages/niivue-react)
