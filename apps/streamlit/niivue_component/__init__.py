import os
import warnings
import streamlit as st
import streamlit.components.v1 as components
import base64

_RELEASE = os.environ.get("NIIVUE_DEV") != "1"


@st.cache_data(show_spinner=False, hash_funcs={bytes: id})
def _encode_b64(data: bytes) -> str:
    """Base64-encode bytes, cached by object identity.

    ``hash_funcs={bytes: id}`` is critical: without it Streamlit hashes the
    full bytes object on every call, which costs roughly as much as
    encoding. With ``id`` the cache hits whenever the same bytes object is
    passed — typically the value returned from a user-level
    ``@st.cache_data`` loader — so repeated re-runs (e.g. fragment re-runs
    on click) skip the encode entirely.
    """
    return base64.b64encode(data).decode()

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
    paired_data=None,
    overlays=None,
    meshes=None,
    height=600,
    view_mode="multiplanar",
    styled=True,
    settings=None,
    update_interval_ms=100,
    key=None
):
    """Create a NiiVue viewer component.

    Parameters:
    -----------
    nifti_data : bytes or None
        Raw NIFTI file data for the main image
    filename : str
        Name of the file being displayed
    paired_data : bytes or None
        Raw voxel data for detached formats. Required when ``nifti_data`` is
        an MHD header with ``ElementDataFile`` pointing to a separate file
        (typically ``.raw``). Ignored for self-contained formats.
    overlays : list of dict, optional
        List of overlay images, each with:
        - data: bytes - overlay image data
        - name: str - overlay filename
        - colormap: str, optional - colormap name (default: 'red')
        - opacity: float, optional - opacity 0-1 (default: 0.5)
    meshes : list of dict, optional
        List of mesh surfaces to display (e.g. FreeSurfer pial, white, inflated), each with:
        - data: bytes - mesh file data
        - name: str - mesh filename (must include extension, e.g. 'lh.pial', 'brain.gii')
        - overlays: list of dict, optional - mesh overlays for the first mesh only
            (curvature, thickness, etc.). Overlays on non-first meshes are ignored.
            - data: bytes - overlay data
            - name: str - overlay filename (e.g. 'lh.thickness', 'lh.curv')
            - colormap: str, optional - colormap name (default: 'redyell')
            - opacity: float, optional - opacity 0-1 (default: 0.7)
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
    update_interval_ms : int or None
        Throttle interval in ms for click/drag events sent back to Python
        (default: 100). Set to None to disable click feedback entirely —
        this restores the low-latency behaviour of the pre-overlay viewer
        and is recommended whenever the return value is not consumed.
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
        nifti_base64 = _encode_b64(nifti_data)

    # Convert paired_data (detached raw voxels for MHD) to base64 if provided
    paired_base64 = ""
    if paired_data is not None:
        if not isinstance(paired_data, bytes):
            raise ValueError("paired_data must be bytes")
        paired_base64 = _encode_b64(paired_data)
    
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
                "data": _encode_b64(overlay["data"]),
                "name": overlay.get("name") or overlay.get("filename", "overlay"),
                "colormap": overlay.get("colormap", "red"),
                "opacity": overlay.get("opacity", 0.5),
            }
            overlays_data.append(overlay_dict)
    
    # Convert meshes to base64
    meshes_data = []
    if meshes:
        for i, mesh in enumerate(meshes):
            if 'data' not in mesh:
                raise ValueError(f"Mesh {i}: 'data' field is required")
            if not isinstance(mesh['data'], bytes):
                raise ValueError(f"Mesh {i}: 'data' must be bytes")
            if 'name' not in mesh:
                raise ValueError(f"Mesh {i}: 'name' field is required")
            
            mesh_dict = {
                "data": _encode_b64(mesh["data"]),
                "name": mesh["name"],
            }
            
            # Convert mesh overlays to base64 (only first mesh overlays are applied)
            mesh_overlays = []
            if 'overlays' in mesh and mesh['overlays']:
                if i > 0:
                    warnings.warn(
                        f"Mesh {i}: overlays are only supported on the first mesh and will be ignored.",
                        stacklevel=2,
                    )
                else:
                    for j, mo in enumerate(mesh['overlays']):
                        if 'data' not in mo:
                            raise ValueError(f"Mesh {i}, overlay {j}: 'data' field is required")
                        if not isinstance(mo['data'], bytes):
                            raise ValueError(f"Mesh {i}, overlay {j}: 'data' must be bytes")
                        if 'name' not in mo:
                            raise ValueError(f"Mesh {i}, overlay {j}: 'name' field is required")
                        mesh_overlays.append({
                            "data": _encode_b64(mo["data"]),
                            "name": mo["name"],
                            "colormap": mo.get("colormap", "redyell"),
                            "opacity": mo.get("opacity", 0.7),
                        })
            mesh_dict["overlays"] = mesh_overlays
            meshes_data.append(mesh_dict)
    
    # Call the component
    component_value = _component_func(
        nifti_data=nifti_base64,
        filename=filename,
        paired_data=paired_base64 if paired_base64 else None,
        overlays=overlays_data if overlays_data else None,
        meshes=meshes_data if meshes_data else None,
        height=height,
        view_mode=view_mode,
        styled=styled,
        settings=settings or {},
        update_interval_ms=update_interval_ms,
        default=None,
        key=key
    )
    return component_value
