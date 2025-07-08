# NiiVue Streamlit Component

A Streamlit component for viewing NIFTI files using the NiiVue library.

## Installation

### Development Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install and build the frontend:
```bash
cd frontend
npm install
npm run build
```

3. Run your Streamlit app:
```bash
streamlit run ../app_component.py
```

### For Development with Hot Reload

1. In one terminal, start the React development server:
```bash
cd frontend
npm start
```

2. In your Python component (`__init__.py`), set `_RELEASE = False`

3. In another terminal, run your Streamlit app:
```bash
streamlit run ../app_component.py
```

## Usage

```python
import streamlit as st
from niivue_component import niivue_viewer, read_build_files

# Read NiiVue build files
css_content, js_content = read_build_files()

# Create viewer
niivue_viewer(
    nifti_data=your_nifti_bytes,
    filename="example.nii.gz",
    height=600,
    css_content=css_content,
    js_content=js_content,
    key="unique_key"
)
```

## Component Structure

- `__init__.py` - Main Python component
- `frontend/` - React frontend
  - `src/NiiVueViewer.tsx` - Main React component
  - `package.json` - Node dependencies
- `setup.py` - Package configuration
