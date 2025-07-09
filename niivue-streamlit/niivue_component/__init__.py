import os
import streamlit.components.v1 as components
import base64
from pathlib import Path
import pkg_resources

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

def _load_niivue_assets():
    """Load CSS and JS content from bundled assets"""
    try:
        # Try to load from package resources first (when installed via pip)
        try:
            css_content = pkg_resources.resource_string(__name__, 'assets/index.css').decode('utf-8')
            js_content = pkg_resources.resource_string(__name__, 'assets/index.js').decode('utf-8')
            return css_content, js_content
        except:
            # Fallback to file system access (development mode)
            assets_dir = Path(__file__).parent / 'assets'
            css_file = assets_dir / 'index.css'
            js_file = assets_dir / 'index.js'
            
            if css_file.exists() and js_file.exists():
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_content = f.read()
                with open(js_file, 'r', encoding='utf-8') as f:
                    js_content = f.read()
                return css_content, js_content
            else:
                raise FileNotFoundError("NiiVue assets not found")
    except Exception as e:
        raise RuntimeError(f"Failed to load NiiVue assets: {e}")

def niivue_viewer(nifti_data=None, filename="", height=600, key=None):
    """Create a NiiVue viewer component.
    
    Parameters:
    -----------
    nifti_data : bytes or None
        Raw NIFTI file data
    filename : str
        Name of the file being displayed
    height : int
        Height of the component in pixels
    key : str or None
        Unique key for the component
        
    Returns:
    --------
    dict or None
        Component return value (if any)
    """
    # Load CSS and JS content internally
    css_content, js_content = _load_niivue_assets()
    
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
