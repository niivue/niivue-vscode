import os
import streamlit.components.v1 as components
import base64
from pathlib import Path

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = True

# Declare a Streamlit component
if not _RELEASE:
    _component_func = components.declare_component(
        "niivue_viewer",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component(
        "niivue_viewer", 
        path=build_dir
    )

def niivue_viewer(nifti_data=None, filename="", height=600, css_content="", js_content="", key=None):
    """Create a NiiVue viewer component.
    
    Parameters:
    -----------
    nifti_data : bytes or None
        Raw NIFTI file data
    filename : str
        Name of the file being displayed
    height : int
        Height of the component in pixels
    css_content : str
        CSS content from NiiVue build
    js_content : str
        JavaScript content from NiiVue build
    key : str or None
        Unique key for the component
        
    Returns:
    --------
    dict or None
        Component return value (if any)
    """
    # Convert nifti_data to base64 if provided
    nifti_base64 = ""
    if nifti_data is not None:
        nifti_base64 = base64.b64encode(nifti_data).decode()
    
    component_value = _component_func(
        nifti_data=nifti_base64,
        filename=filename,
        height=height,
        css_content=css_content,
        js_content=js_content,
        default=None,
        key=key
    )
    return component_value

# Helper function to read build files (same as your original)
def read_build_files():
    """Read the CSS and JS files from the niivue build directory"""
    app_dir = Path(__file__).parent.parent.absolute()
    
    # Try multiple possible locations for the niivue build directory
    possible_build_dirs = [
        app_dir.parent / "niivue" / "build",  # When running from parent dir
        app_dir / ".." / "niivue" / "build",  # Alternative parent reference
        Path.cwd() / "niivue" / "build",      # When running from root
    ]
    
    css_content = ""
    js_content = ""
    
    for build_dir in possible_build_dirs:
        if build_dir.exists():
            css_file = build_dir / "assets" / "index.css"
            js_file = build_dir / "assets" / "index.js"
            
            if css_file.exists() and js_file.exists():
                try:
                    with open(css_file, 'r', encoding='utf-8') as f:
                        css_content = f.read()
                    with open(js_file, 'r', encoding='utf-8') as f:
                        js_content = f.read()
                    return css_content, js_content
                except Exception as e:
                    print(f"Error reading build files: {e}")
                    continue
    
    return css_content, js_content
