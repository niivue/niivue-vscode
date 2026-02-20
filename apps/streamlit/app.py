"""Getting Started — NiiVue Streamlit Component."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Getting Started")
st.title("🧠 NiiVue Viewer")
st.caption("Full styled view with menu bar and interaction controls.")

# Load bundled example image
data_path = Path(__file__).parent / "tests" / "assets" / "lesion.nii.gz"
if not data_path.exists():
    st.error(f"Required file {data_path.name} not found.")
    st.stop()

image_data = data_path.read_bytes()

# Use the component in styled mode
niivue_viewer(
    nifti_data=image_data,
    filename=data_path.name,
    height=700,
    styled=True,
    view_mode="multiplanar",
    key="viewer",
)

st.markdown(
    """
    ---
    **Quick Tip**: Use the menu bar above to change colormaps or view settings.
    You can also drag and drop NIFTI files directly onto the viewer!
    """
)
