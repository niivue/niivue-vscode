"""Bidirectional Communication — Voxel click feedback.

Demonstrates the recommended pattern for click-event round-trips:

1. Load and encode the NIfTI bytes once via ``@st.cache_data`` so repeated
   Streamlit re-runs don't re-read the file or re-allocate the buffer.
2. Wrap the viewer and its readout in ``@st.fragment`` so that a click only
   re-runs the fragment, not the whole script.

Combined with the default ``update_interval_ms=100`` throttle, this keeps the
viewer canvas fully interactive even while round-tripping click data back to
Python. Set ``update_interval_ms=None`` to disable feedback entirely.
"""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Bidirectional")

st.title("🧠 Bidirectional Communication")
st.caption("Click anywhere in the viewer. Voxel coordinates and intensity are sent back to Python.")


@st.cache_data
def load_nifti(path: str) -> bytes:
    """Read NIfTI bytes once per session. Keyed on the path string."""
    return Path(path).read_bytes()


data_path = Path(__file__).parent / "tests" / "assets" / "lesion.nii.gz"
if not data_path.exists():
    st.error(f"Required file {data_path.name} not found.")
    st.stop()

image_data = load_nifti(str(data_path))


@st.fragment
def viewer_fragment():
    col1, col2 = st.columns([3, 1])

    with col1:
        result = niivue_viewer(
            nifti_data=image_data,
            filename=data_path.name,
            height=600,
            styled=True,
            key="bidir_viewer",
        )

    with col2:
        st.subheader("🎯 Click Info")
        if result and result.get("type") == "voxel_click":
            st.metric("Voxel Value", f"{result['value']:.4f}")

            st.write("**Voxel Coordinates:**")
            st.code(f"x: {result['voxel'][0]}\ny: {result['voxel'][1]}\nz: {result['voxel'][2]}", language="yaml")

            st.write("**World Coordinates (mm):**")
            st.code(f"x: {result['mm'][0]:.2f}\ny: {result['mm'][1]:.2f}\nz: {result['mm'][2]:.2f}", language="yaml")

            st.success("Python received this data from the React component!")
        else:
            st.info("Click on a brain region in the viewer to see its data here.")
            st.image("https://niivue.github.io/niivue/niivue.png", width=100)  # Subtle decoration


viewer_fragment()
