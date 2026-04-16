"""Overlay Example — Multiple volumes in a single viewer."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Overlays")
st.title("🧠 NiiVue Overlay Example")
st.caption("Demonstrating how to load a background image with one or more overlays.")

# Load background image
background_path = Path(__file__).parent / "tests" / "assets" / "pcasl.nii.gz"
if not background_path.exists():
    st.error(f"Required file {background_path.name} not found.")
    st.stop()

# Load overlay image
overlay_path = Path(__file__).parent / "tests" / "assets" / "fslmean.nii.gz"
if not overlay_path.exists():
    st.error(f"Required file {overlay_path.name} not found.")
    st.stop()

@st.cache_data
def load_bytes(path: str) -> bytes:
    return Path(path).read_bytes()


background_data = load_bytes(str(background_path))
overlay_data = load_bytes(str(overlay_path))

# Define overlays
overlays = [
    {
        "data": overlay_data,
        "name": overlay_path.name,
        "colormap": "red",
        "opacity": 0.4
    }
]

col1, col2 = st.columns([4, 1])

with col1:
    niivue_viewer(
        nifti_data=background_data,
        filename="pcasl.nii.gz",
        overlays=overlays,
        height=700,
        styled=True,
        update_interval_ms=None,
        key="overlay_viewer"
    )

with col2:
    st.subheader("Layer Info")
    st.write("**Base:** pcasl (Gray)")
    st.write("**Overlay 1:** fslmean (Red, 40% opacity)")
    
    st.divider()
    st.info("""
    In the `niivue_viewer` call, you can pass a list of overlays:
    ```python
    overlays = [{
        "data": bytes,
        "name": "my_overlay",
        "colormap": "red",
        "opacity": 0.5
    }]
    ```
    """)
