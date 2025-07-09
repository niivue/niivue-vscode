#!/usr/bin/env python3
"""
Simple test script to verify the niivue_component works with the simplified API
"""

import streamlit as st
from niivue_component import niivue_viewer

st.set_page_config(layout="wide", page_title="NiiVue Component Test")

st.title("🧠 NiiVue Component Test")
st.markdown("Testing the simplified niivue_viewer API")

# Test with no data (empty viewer)
st.subheader("Empty Viewer Test")
try:
    result = niivue_viewer(
        nifti_data=None,
        filename="",
        height=400,
        key="test_empty"
    )
    st.success("✅ Empty viewer loaded successfully!")
    if result:
        st.write("Component returned:", result)
except Exception as e:
    st.error(f"❌ Error loading empty viewer: {e}")

# File upload test
st.subheader("File Upload Test")
uploaded_file = st.file_uploader(
    "Choose a NIFTI file to test",
    type=["nii", "nii.gz"],
    help="Upload a NIFTI file to test the viewer with data."
)

if uploaded_file is not None:
    try:
        file_bytes = uploaded_file.getvalue()
        filename = uploaded_file.name
        
        st.write(f"**Filename:** {filename}")
        st.write(f"**File size:** {len(file_bytes):,} bytes")
        
        result = niivue_viewer(
            nifti_data=file_bytes,
            filename=filename,
            height=600,
            key="test_with_data"
        )
        st.success("✅ Viewer with data loaded successfully!")
        if result:
            st.write("Component returned:", result)
    except Exception as e:
        st.error(f"❌ Error loading viewer with data: {e}")

st.markdown("---")
st.markdown("**API Summary:**")
st.code("""
from niivue_component import niivue_viewer

# Simple usage - CSS and JS are handled internally
result = niivue_viewer(
    nifti_data=file_bytes,  # bytes or None
    filename="example.nii", # str
    height=600,            # int (optional, default: 600)
    key="unique_key"       # str (optional)
)
""", language="python")
