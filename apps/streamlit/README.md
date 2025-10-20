# NiiVue Streamlit Component

A Streamlit component that integrates the [NiiVue](https://github.com/niivue/niivue) neuroimaging viewer for interactive NIFTI file visualization in web applications.

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
       file_bytes = uploaded_file.getvalue()
       niivue_viewer(
           nifti_data=file_bytes,
           filename=uploaded_file.name,
           height=600,
           key="niivue_viewer"
       )
   ```

### Development Setup

1. **Clone and setup** (run from the project root):
   ```bash
   # Linux/Mac
   cd niivue-streamlit
   ./setup.sh
   
   # Windows
   cd niivue-streamlit
   setup.bat
   ```

2. **Run the application**:
   ```bash
   streamlit run app_component.py
   ```
