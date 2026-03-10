import os
import streamlit.components.v1 as components
import base64

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


def niivue_viewer(
    nifti_data=None,
    filename="",
    overlays=None,
    height=600,
    view_mode="multiplanar",
    styled=True,
    settings=None,
    key=None
):
    """Create a NiiVue viewer component.
    
    Parameters:
    -----------
    nifti_data : bytes or None
        Raw NIFTI file data for the main image
    filename : str
        Name of the file being displayed
    overlays : list of dict, optional
        List of overlay images, each with:
        - data: bytes - overlay image data
        - name: str - overlay filename
        - colormap: str, optional - colormap name (default: 'red')
        - opacity: float, optional - opacity 0-1 (default: 0.5)
    height : int
        Height of the component in pixels (default: 600)
    view_mode : str
        View mode: 'axial', 'coronal', 'sagittal', '3d', or 'multiplanar' (default)
    styled : bool
        If True, use StyledViewer with menu. If False, use minimal UnstyledCanvas (default: True)
    settings : dict, optional
        Display settings:
        - crosshair: bool - show crosshair (default: True)
        - radiological: bool - radiological convention (default: False)
        - colorbar: bool - show colorbar (default: False)
        - interpolation: bool - interpolate voxels (default: True)
    key : str or None
        Unique key for the component
        
    Returns:
    --------
    dict or None
        Component return value with click event data if any:
        - type: 'voxel_click'
        - voxel: [x, y, z] voxel coordinates
        - mm: [x, y, z] mm coordinates
        - value: voxel value at click position
        - filename: name of the file
    """
    # Convert nifti_data to base64 if provided
    nifti_base64 = ""
    if nifti_data is not None:
        nifti_base64 = base64.b64encode(nifti_data).decode()
    
    # Convert overlays to base64
    overlays_data = []
    if overlays:
        for i, overlay in enumerate(overlays):
            # Validate overlay structure
            if 'data' not in overlay:
                raise ValueError(f"Overlay {i}: 'data' field is required")
            if not isinstance(overlay['data'], bytes):
                raise ValueError(f"Overlay {i}: 'data' must be bytes")
            if 'name' not in overlay and 'filename' not in overlay:
                raise ValueError(f"Overlay {i}: either 'name' or 'filename' field is required")
            
            overlay_dict = {
                "data": base64.b64encode(overlay["data"]).decode(),
                "name": overlay.get("name") or overlay.get("filename", "overlay"),
                "colormap": overlay.get("colormap", "red"),
                "opacity": overlay.get("opacity", 0.5),
            }
            overlays_data.append(overlay_dict)
    
    # Call the component
    component_value = _component_func(
        nifti_data=nifti_base64,
        filename=filename,
        overlays=overlays_data if overlays_data else None,
        height=height,
        view_mode=view_mode,
        styled=styled,
        settings=settings or {},
        default=None,
        key=key
    )
    return component_value
