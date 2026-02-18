"""Bidirectional Communication — Voxel click feedback."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — Bidirectional")

st.title("🧠 Bidirectional Communication")
st.caption("Click anywhere in the viewer. Voxel coordinates and intensity are sent back to Python.")

# Load bundled example image
data_path = Path(__file__).parent / "tests" / "assets" / "lesion.nii.gz"
if not data_path.exists():
    st.error(f"Required file {data_path.name} not found.")
    st.stop()

image_data = data_path.read_bytes()

col1, col2 = st.columns([3, 1])

with col1:
    # The component returns a dict when a click event occurs
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
        st.image("https://niivue.github.io/niivue/niivue.png", width=100) # Subtle decoration
