import streamlit as st
from niivue_component import niivue_viewer

# --- STREAMLIT APPLICATION ---

st.set_page_config(layout="wide", page_title="NIFTI Viewer")

st.title("🧠 Interactive NIFTI File Viewer")
st.markdown("Upload a `.nii` or `.nii.gz` file to visualize it with the integrated NiiVue viewer.")

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

    # Use the component
    with st.spinner(f"Loading {filename}..."):
        result = niivue_viewer(
            nifti_data=file_bytes,
            filename=filename,
            height=700,
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
