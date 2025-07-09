# NiiVue Streamlit Component

A Streamlit component for viewing NIFTI files using the NiiVue library.

## Installation

### From PyPI (Recommended)

```bash
pip install niivue-streamlit
```

### Development Setup

1. Clone the repository and navigate to the component directory:
```bash
cd niivue_component
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install and build the frontend:
```bash
cd frontend
npm install
npm run build
```

4. Install the component in development mode:
```bash
pip install -e .
```

## Usage

The component now handles all NiiVue assets internally, making it very simple to use:

```python
import streamlit as st
from niivue_component import niivue_viewer

# Simple usage - no need to handle CSS/JS files
uploaded_file = st.file_uploader("Choose a NIFTI file", type=["nii", "nii.gz"])

if uploaded_file is not None:
    file_bytes = uploaded_file.getvalue()
    
    result = niivue_viewer(
        nifti_data=file_bytes,
        filename=uploaded_file.name,
        height=600,
        key="niivue_viewer"
    )
```

## API Reference

### `niivue_viewer(nifti_data=None, filename="", height=600, key=None)`

Parameters:
- `nifti_data` (bytes, optional): Raw NIFTI file data
- `filename` (str, optional): Name of the file being displayed
- `height` (int, optional): Height of the component in pixels (default: 600)
- `key` (str, optional): Unique key for the component

Returns:
- `dict` or `None`: Component return value (if any)

## Development

### For Development with Hot Reload

1. In one terminal, start the React development server:
```bash
cd frontend
npm start
```

2. In your Python component (`__init__.py`), set `_RELEASE = False`

3. In another terminal, run your Streamlit app:
```bash
streamlit run test_simplified_api.py
```

## Component Structure

- `__init__.py` - Main Python component with asset loading
- `assets/` - Bundled NiiVue CSS, JS, and WASM files (auto-generated, not in git)
- `frontend/` - React frontend
  - `src/NiiVueViewer.tsx` - Main React component
  - `package.json` - Node dependencies
- `setup.py` - Package configuration

## Publishing to PyPI

The component is ready for PyPI publication with all assets bundled:

```bash
python setup.py sdist bdist_wheel
twine upload dist/*
```
