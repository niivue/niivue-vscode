import streamlit as st
from niivue_component import niivue_viewer, read_build_files

# --- STREAMLIT APPLICATION ---

st.set_page_config(layout="wide", page_title="NIFTI Viewer")

st.title("🧠 Interactive NIFTI File Viewer")
st.markdown("Upload a `.nii` or `.nii.gz` file to visualize it with the integrated NiiVue viewer.")

# Read the build files at startup
CSS_CONTENT, JS_CONTENT = read_build_files()

# Check if static files are ready
FILES_READY = bool(CSS_CONTENT and JS_CONTENT)

if not FILES_READY:
    st.error("⚠️ NiiVue build files not found. Please run `npm run build` in the niivue directory first.")
    st.stop()

# --- SIDEBAR FOR FILE UPLOAD AND OPTIONS ---
with st.sidebar:
    st.header("Upload & Options")
    uploaded_file = st.file_uploader(
        "Choose a NIFTI file",
        type=["nii", "nii.gz"],
        help="You can upload NIFTI files in .nii or compressed .nii.gz format."
    )

# --- MAIN PANEL FOR THE VIEWER ---
if uploaded_file is not None:
    # Read the uploaded file as bytes
    file_bytes = uploaded_file.getvalue()
    filename = uploaded_file.name
    
    # Debug information in sidebar
    with st.sidebar:
        st.subheader("File Information")
        st.write(f"**Filename:** {filename}")
        st.write(f"**File size:** {len(file_bytes):,} bytes")
        st.write(f"**Build files:** {'✅ Ready' if FILES_READY else '❌ Missing'}")

    # Use the component
    with st.spinner(f"Loading {filename}..."):
        result = niivue_viewer(
            nifti_data=file_bytes,
            filename=filename,
            height=700,
            css_content=CSS_CONTENT,
            js_content=JS_CONTENT,
            key="niivue_main"
        )
    
    # Handle any return values from component
    if result:
        st.write("Component returned:", result)

else:
    # Show empty viewer
    result = niivue_viewer(
        nifti_data=None,
        filename="",
        height=700,
        css_content=CSS_CONTENT,
        js_content=JS_CONTENT,
        key="niivue_empty"
    )

st.markdown(
    """
    <hr>
    <p style='text-align: center;'>
        Powered by <a href="https://streamlit.io" target="_blank">Streamlit</a> and
        <a href="https://github.com/niivue/niivue" target="_blank">NiiVue</a> 
        (integrated from local build).
    </p>
    """,
    unsafe_allow_html=True
)
