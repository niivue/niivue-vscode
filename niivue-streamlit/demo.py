import streamlit as st
from niivue_component import niivue_viewer, read_build_files
import base64

# --- STREAMLIT APPLICATION ---

st.set_page_config(layout="wide", page_title="NiiVue Streamlit Demo", page_icon="🧠")

st.title("🧠 NiiVue Streamlit Component Demo")
st.markdown("""
This demo showcases the NiiVue Streamlit component with various features:
- Upload and visualize NIFTI files
- Multiple viewer configurations
- Real-time interaction with the 3D brain viewer
""")

# Read the build files at startup
CSS_CONTENT, JS_CONTENT = read_build_files()

# Check if static files are ready
FILES_READY = bool(CSS_CONTENT and JS_CONTENT)

if not FILES_READY:
    st.error("⚠️ NiiVue build files not found. Please run the setup script first.")
    st.code("./setup.sh  # Linux/Mac\nsetup.bat   # Windows")
    st.stop()

# --- SIDEBAR FOR FILE UPLOAD AND OPTIONS ---
with st.sidebar:
    st.header("🎛️ Controls")
    
    # File uploader
    uploaded_file = st.file_uploader(
        "Choose a NIFTI file",
        type=["nii", "nii.gz"],
        help="Upload NIFTI files in .nii or compressed .nii.gz format."
    )
    
    # Viewer options
    st.subheader("Viewer Settings")
    viewer_height = st.slider("Viewer Height", 400, 1000, 700, 50)
    
    # Example data section
    st.subheader("📁 Example Data")
    st.markdown("No example files provided. Upload your own NIFTI file to get started.")

# Create tabs for different views
tab1, tab2, tab3 = st.tabs(["🧠 Main Viewer", "📊 Info", "⚙️ Settings"])

with tab1:
    if uploaded_file is not None:
        # Read the uploaded file as bytes
        file_bytes = uploaded_file.getvalue()
        filename = uploaded_file.name
        
        # Use the component
        with st.spinner(f"Loading {filename}..."):
            result = niivue_viewer(
                nifti_data=file_bytes,
                filename=filename,
                height=viewer_height,
                css_content=CSS_CONTENT,
                js_content=JS_CONTENT,
                key="niivue_main"
            )
        
        # Handle any return values from component
        if result:
            st.json(result)

    else:
        # Show empty viewer with instructions
        st.info("👆 Upload a NIFTI file using the sidebar to begin visualization")
        result = niivue_viewer(
            nifti_data=None,
            filename="",
            height=viewer_height,
            css_content=CSS_CONTENT,
            js_content=JS_CONTENT,
            key="niivue_empty"
        )

with tab2:
    st.subheader("📋 File Information")
    if uploaded_file is not None:
        file_bytes = uploaded_file.getvalue()
        
        # File stats
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Filename", uploaded_file.name)
        with col2:
            st.metric("File Size", f"{len(file_bytes):,} bytes")
        with col3:
            st.metric("Base64 Size", f"{len(base64.b64encode(file_bytes).decode()):,} chars")
        
        # Technical details
        st.subheader("🔧 Technical Details")
        st.write(f"**MIME Type:** {uploaded_file.type}")
        st.write(f"**Build Status:** {'✅ Ready' if FILES_READY else '❌ Missing'}")
        
        # Raw data preview (first 100 bytes)
        with st.expander("🔍 Raw Data Preview"):
            st.code(file_bytes[:100].hex())
    else:
        st.info("Upload a file to see detailed information")

with tab3:
    st.subheader("⚙️ Component Settings")
    
    # Build information
    st.write("**Build Files Status:**")
    st.write(f"- CSS Content: {len(CSS_CONTENT):,} characters" if CSS_CONTENT else "- CSS Content: ❌ Missing")
    st.write(f"- JS Content: {len(JS_CONTENT):,} characters" if JS_CONTENT else "- JS Content: ❌ Missing")
    
    # Component info
    st.subheader("🔄 Component Information")
    st.write("""
    This Streamlit component integrates the NiiVue neuroimaging viewer:
    
    - **Frontend:** React + TypeScript
    - **Backend:** Python + Streamlit
    - **Viewer:** NiiVue WebGL viewer
    - **Data Flow:** File → Base64 → iframe → NiiVue
    """)
    
    # Debug section
    with st.expander("🐛 Debug Information"):
        st.json({
            "css_loaded": bool(CSS_CONTENT),
            "js_loaded": bool(JS_CONTENT),
            "css_size": len(CSS_CONTENT),
            "js_size": len(JS_CONTENT),
            "viewer_height": viewer_height,
            "has_upload": uploaded_file is not None
        })

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center;'>
        <p>
            🧠 Powered by <a href="https://streamlit.io" target="_blank">Streamlit</a> and
            <a href="https://github.com/niivue/niivue" target="_blank">NiiVue</a>
        </p>
        <p>
            <small>Built with the NiiVue Streamlit Component</small>
        </p>
    </div>
    """,
    unsafe_allow_html=True
)
