"""Advanced Showcase — All features and sidebar controls."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Advanced")

st.title("🧠 NiiVue Advanced Showcase")

# Load bundled example image
data_path = Path(__file__).parent / "tests" / "assets" / "lesion.nii.gz"
if not data_path.exists():
    st.error(f"Required file {data_path.name} not found.")
    st.stop()

image_data = data_path.read_bytes()

# Sidebar for configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    view_mode = st.selectbox(
        "View Mode",
        ["multiplanar", "axial", "coronal", "sagittal", "3d"],
        help="Select the viewing perspective"
    )
    
    height = st.slider("Viewer Height (px)", 400, 1000, 700, 50)
    
    st.divider()
    st.subheader("Display Settings")
    show_crosshair = st.checkbox("Show Crosshair", value=True)
    radiological = st.checkbox("Radiological Convention", value=False)
    show_colorbar = st.checkbox("Show Colorbar", value=False)
    interpolation = st.checkbox("Interpolation", value=True)

# Prepare settings dictionary
settings = {
    "crosshair": show_crosshair,
    "radiological": radiological,
    "colorbar": show_colorbar,
    "interpolation": interpolation
}

# Render the viewer in styled mode
niivue_viewer(
    nifti_data=image_data,
    filename=data_path.name,
    height=height,
    view_mode=view_mode,
    styled=True,
    settings=settings,
    key="advanced_viewer"
)

st.info("👈 Use the sidebar to adjust the view mode and display settings.")
