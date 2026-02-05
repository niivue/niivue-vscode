import streamlit as st
from niivue_component import niivue_viewer
import urllib.request

# --- STREAMLIT APPLICATION ---

st.set_page_config(layout="wide", page_title="NiiVue Viewer - Advanced Demo")

st.title("🧠 NiiVue Streamlit Component - Advanced Demo")
st.markdown("Upload NIFTI files or load examples to visualize neuroimaging data with the integrated NiiVue viewer.")

# --- SIDEBAR FOR OPTIONS ---
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # Component mode selection
    styled = st.checkbox("Show Menu & Controls", value=True, 
                        help="If checked, shows StyledViewer with menu. Otherwise shows minimal canvas.")
    
    # View mode selection
    view_mode = st.selectbox(
        "View Mode",
        ["multiplanar", "axial", "coronal", "sagittal", "3d"],
        help="Select the viewing perspective"
    )
    
    # Display settings
    st.subheader("Display Settings")
    show_crosshair = st.checkbox("Show Crosshair", value=True)
    radiological = st.checkbox("Radiological Convention", value=False)
    show_colorbar = st.checkbox("Show Colorbar", value=False)
    interpolation = st.checkbox("Interpolation", value=True)
    
    # Height slider
    height = st.slider("Viewer Height (px)", 400, 1000, 700, 50)
    
    st.divider()
    st.header("📂 File Upload")
    uploaded_file = st.file_uploader(
        "Main Image (NIFTI)",
        type=["nii", "nii.gz"],
        help="Upload a NIFTI file (.nii or .nii.gz)"
    )
    
    # Overlay upload
    overlay_file = st.file_uploader(
        "Overlay Image (Optional)",
        type=["nii", "nii.gz"],
        help="Upload an overlay NIFTI file"
    )
    
    if overlay_file:
        overlay_colormap = st.selectbox(
            "Overlay Colormap",
            ["red", "green", "blue", "hot", "cool", "winter", "warm"]
        )
        overlay_opacity = st.slider("Overlay Opacity", 0.0, 1.0, 0.5, 0.1)
    
    st.divider()
    
    # Example data option
    use_example = st.button("📥 Load Example (MNI152)")

# --- MAIN PANEL FOR THE VIEWER ---

# Prepare settings dictionary
settings = {
    "crosshair": show_crosshair,
    "radiological": radiological,
    "colorbar": show_colorbar,
    "interpolation": interpolation
}

# Initialize data variables
nifti_data = None
filename = ""
overlays = None

# Handle example data loading
if use_example:
    with st.spinner("Downloading example data..."):
        try:
            # Download MNI152 template
            url = "https://niivue.github.io/niivue-demo-images/mni152.nii.gz"
            with urllib.request.urlopen(url) as response:
                nifti_data = response.read()
            filename = "mni152.nii.gz"
            st.sidebar.success("✅ Example data loaded!")
        except Exception as e:
            st.sidebar.error(f"Failed to load example: {e}")

# Handle uploaded file
elif uploaded_file is not None:
    nifti_data = uploaded_file.getvalue()
    filename = uploaded_file.name
    
    # Handle overlay if provided
    if overlay_file:
        overlay_data = overlay_file.getvalue()
        overlays = [{
            "data": overlay_data,
            "name": overlay_file.name,
            "colormap": overlay_colormap,
            "opacity": overlay_opacity
        }]
    
    # Show file information
    with st.sidebar:
        st.subheader("📊 File Information")
        st.write(f"**Main:** {filename} ({len(nifti_data):,} bytes)")
        if overlay_file:
            st.write(f"**Overlay:** {overlay_file.name} ({len(overlay_data):,} bytes)")

# Render the viewer
col1, col2 = st.columns([3, 1])

with col1:
    if nifti_data:
        with st.spinner(f"Loading {filename}..."):
            result = niivue_viewer(
                nifti_data=nifti_data,
                filename=filename,
                overlays=overlays,
                height=height,
                view_mode=view_mode,
                styled=styled,
                settings=settings,
                key="niivue_viewer"
            )
        
        # Display click event data if available
        if result and result.get("type") == "voxel_click":
            with col2:
                st.subheader("🎯 Click Info")
                st.write(f"**Voxel:** {result['voxel']}")
                st.write(f"**Position (mm):** {result['mm']}")
                st.write(f"**Value:** {result['value']:.4f}")
                st.write(f"**File:** {result['filename']}")
    else:
        st.info("👈 Upload a NIFTI file or load an example to begin")
        # Show empty viewer
        result = niivue_viewer(
            nifti_data=None,
            filename="",
            height=height,
            view_mode=view_mode,
            styled=styled,
            settings=settings,
            key="niivue_empty"
        )

with col2:
    if not nifti_data:
        st.subheader("ℹ️ Features")
        st.markdown("""
        **Two Component Modes:**
        - ✅ Styled: Full menu & controls
        - 🎨 Minimal: Canvas only
        
        **View Modes:**
        - 🔄 Multiplanar
        - ⬆️ Axial
        - ➡️ Coronal
        - ⬇️ Sagittal
        - 🎮 3D Render
        
        **Features:**
        - 📎 Overlay support
        - 🎨 Custom colormaps
        - 🎯 Click events
        - ⚙️ Display settings
        """)

# Footer
st.markdown(
    """
    <hr>
    <p style='text-align: center;'>
        Powered by <a href="https://streamlit.io" target="_blank">Streamlit</a> and
        <a href="https://github.com/niivue/niivue" target="_blank">NiiVue</a>
    </p>
    """,
    unsafe_allow_html=True
)
