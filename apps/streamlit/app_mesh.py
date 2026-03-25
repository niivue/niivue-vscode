"""Mesh Example — Displaying surface meshes in the viewer."""
import streamlit as st
from niivue_component import niivue_viewer

st.set_page_config(layout="wide", page_title="NiiVue — Meshes")
st.title("🧠 NiiVue Mesh Example")
st.caption("Demonstrating how to load FreeSurfer surface meshes.")

# File uploader for mesh files
mesh_file = st.file_uploader(
    "Upload a mesh file",
    type=["pial", "white", "inflated", "gii", "mz3", "stl", "obj", "ply", "vtk"],
    key="mesh_upload"
)

# Optional: mesh overlay file
overlay_file = st.file_uploader(
    "Upload a mesh overlay (optional)",
    type=["thickness", "curv", "sulc", "gii", "mz3", "annot"],
    key="overlay_upload"
)

if mesh_file is not None:
    mesh_data = mesh_file.getvalue()

    meshes = [{
        "data": mesh_data,
        "name": mesh_file.name,
    }]

    # Add mesh overlay if provided
    if overlay_file is not None:
        meshes[0]["overlays"] = [{
            "data": overlay_file.getvalue(),
            "name": overlay_file.name,
            "colormap": "redyell",
            "opacity": 0.7,
        }]

    col1, col2 = st.columns([4, 1])

    with col1:
        niivue_viewer(
            meshes=meshes,
            view_mode="3d",
            height=700,
            styled=True,
            key="mesh_viewer"
        )

    with col2:
        st.subheader("Mesh Info")
        st.write(f"**Mesh:** {mesh_file.name}")
        if overlay_file:
            st.write(f"**Overlay:** {overlay_file.name}")

        st.divider()
        st.info("""
        Load FreeSurfer surfaces like `lh.pial`, `rh.white`, 
        or other mesh formats (`.gii`, `.mz3`, `.stl`, `.obj`).
        
        You can also add mesh overlays like curvature 
        or thickness data.
        """)
else:
    st.info("Upload a mesh file to get started.")
