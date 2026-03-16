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
- `height` (int): Height in pixels (default: 600)
- `view_mode` (str): 'axial', 'coronal', 'sagittal', '3d', 'multiplanar' (default)
- `styled` (bool): Show menu (default: True)
- `settings` (dict, optional):
  - `crosshair` (bool): default True
  - `radiological` (bool): default False
  - `colorbar` (bool): default False
  - `interpolation` (bool): default True
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

- NIFTI (.nii, .nii.gz)
- DICOM (.dcm)
- MINC (.mnc, .mnc.gz)
- MHA/MHD
- NRRD
- MGH/MGZ

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
