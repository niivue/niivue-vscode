"""Minimal Viewer — Canvas only, no menu bar."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Minimal")
st.title("🧠 Minimal NiiVue Viewer")
st.caption("Canvas-only mode (`styled=False`) — perfect for embedding in complex dashboards.")


@st.cache_data
def load_nifti(path: str) -> bytes:
    return Path(path).read_bytes()


# Load bundled example image
data_path = Path(__file__).parent / "tests" / "assets" / "lesion.nii.gz"
if not data_path.exists():
    st.error(f"Required file {data_path.name} not found.")
    st.stop()

image_data = load_nifti(str(data_path))
st.info(f"Loaded {data_path.name} ({len(image_data)/1024/1024:.2f} MB)")

# Use the component in unstyled mode. update_interval_ms=None disables
# click feedback, since this demo doesn't consume the return value.
niivue_viewer(
    nifti_data=image_data,
    filename=data_path.name,
    height=600,
    styled=False,  # Canvas only
    view_mode="axial",
    update_interval_ms=None,
    key="simple",
)

