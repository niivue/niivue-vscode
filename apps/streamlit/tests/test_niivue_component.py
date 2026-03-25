"""Unit tests for the NiiVue Streamlit component."""

import base64
import pytest
from niivue_component import niivue_viewer


def test_niivue_viewer_basic():
    """Test basic niivue_viewer call without data."""
    result = niivue_viewer(
        nifti_data=None,
        filename="",
        height=600,
        key="test_viewer"
    )
    # Component returns None when not in Streamlit context
    assert result is None


def test_niivue_viewer_with_data():
    """Test niivue_viewer with sample data."""
    # Create sample NIFTI-like data
    sample_data = b'\x00' * 1000
    
    result = niivue_viewer(
        nifti_data=sample_data,
        filename="test.nii",
        height=700,
        key="test_viewer_data"
    )
    # Component returns None when not in Streamlit context
    assert result is None


def test_niivue_viewer_with_overlays():
    """Test niivue_viewer with overlay data."""
    sample_data = b'\x00' * 1000
    overlay_data = b'\xFF' * 500
    
    overlays = [{
        'data': overlay_data,
        'name': 'overlay.nii',
        'colormap': 'red',
        'opacity': 0.5
    }]
    
    result = niivue_viewer(
        nifti_data=sample_data,
        filename="base.nii",
        overlays=overlays,
        height=600,
        key="test_overlay"
    )
    assert result is None


def test_niivue_viewer_view_modes():
    """Test different view modes."""
    sample_data = b'\x00' * 1000
    
    view_modes = ['axial', 'coronal', 'sagittal', '3d', 'multiplanar']
    
    for mode in view_modes:
        result = niivue_viewer(
            nifti_data=sample_data,
            filename="test.nii",
            view_mode=mode,
            height=600,
            key=f"test_{mode}"
        )
        assert result is None


def test_niivue_viewer_settings():
    """Test viewer with custom settings."""
    sample_data = b'\x00' * 1000
    
    settings = {
        'crosshair': True,
        'radiological': False,
        'colorbar': True,
        'interpolation': True
    }
    
    result = niivue_viewer(
        nifti_data=sample_data,
        filename="test.nii",
        settings=settings,
        height=600,
        key="test_settings"
    )
    assert result is None


def test_niivue_viewer_styled_variants():
    """Test styled and unstyled component variants."""
    sample_data = b'\x00' * 1000
    
    # Test styled (with menu)
    result_styled = niivue_viewer(
        nifti_data=sample_data,
        filename="test.nii",
        styled=True,
        height=600,
        key="test_styled"
    )
    assert result_styled is None
    
    # Test unstyled (without menu)
    result_unstyled = niivue_viewer(
        nifti_data=sample_data,
        filename="test.nii",
        styled=False,
        height=600,
        key="test_unstyled"
    )
    assert result_unstyled is None


def test_niivue_viewer_empty_height():
    """Test that default height is used when not specified."""
    result = niivue_viewer(
        nifti_data=None,
        filename="",
        key="test_default_height"
    )
    assert result is None


def test_niivue_viewer_multiple_overlays():
    """Test viewer with multiple overlay images."""
    sample_data = b'\x00' * 1000
    
    overlays = [
        {
            'data': b'\xFF' * 500,
            'name': 'overlay1.nii',
            'colormap': 'red',
            'opacity': 0.5
        },
        {
            'data': b'\xAA' * 500,
            'name': 'overlay2.nii',
            'colormap': 'blue',
            'opacity': 0.3
        }
    ]
    
    result = niivue_viewer(
        nifti_data=sample_data,
        filename="base.nii",
        overlays=overlays,
        height=600,
        key="test_multiple_overlays"
    )
    assert result is None


def test_niivue_viewer_with_mesh():
    """Test niivue_viewer with mesh data."""
    mesh_data = b'\x00' * 1000
    
    meshes = [{
        'data': mesh_data,
        'name': 'lh.pial',
    }]
    
    result = niivue_viewer(
        meshes=meshes,
        view_mode='3d',
        height=600,
        key="test_mesh"
    )
    assert result is None


def test_niivue_viewer_mesh_with_overlays():
    """Test mesh with mesh overlays (curvature, thickness)."""
    mesh_data = b'\x00' * 1000
    overlay_data = b'\xFF' * 500
    
    meshes = [{
        'data': mesh_data,
        'name': 'lh.pial',
        'overlays': [{
            'data': overlay_data,
            'name': 'lh.thickness',
            'colormap': 'redyell',
            'opacity': 0.7
        }]
    }]
    
    result = niivue_viewer(
        meshes=meshes,
        view_mode='3d',
        height=600,
        key="test_mesh_overlays"
    )
    assert result is None


def test_niivue_viewer_volume_and_mesh():
    """Test viewer with both a volume and a mesh."""
    volume_data = b'\x00' * 1000
    mesh_data = b'\xFF' * 1000
    
    meshes = [{
        'data': mesh_data,
        'name': 'brain.gii',
    }]
    
    result = niivue_viewer(
        nifti_data=volume_data,
        filename="brain.nii.gz",
        meshes=meshes,
        height=600,
        key="test_volume_and_mesh"
    )
    assert result is None


def test_niivue_viewer_multiple_meshes():
    """Test viewer with multiple meshes."""
    mesh1 = b'\x00' * 1000
    mesh2 = b'\xFF' * 1000
    
    meshes = [
        {'data': mesh1, 'name': 'lh.pial'},
        {'data': mesh2, 'name': 'rh.pial'},
    ]
    
    result = niivue_viewer(
        meshes=meshes,
        view_mode='3d',
        height=600,
        key="test_multiple_meshes"
    )
    assert result is None


def test_niivue_viewer_mesh_validation_missing_data():
    """Test that missing 'data' in mesh raises ValueError."""
    meshes = [{'name': 'lh.pial'}]
    
    with pytest.raises(ValueError, match="'data' field is required"):
        niivue_viewer(meshes=meshes, key="test_mesh_no_data")


def test_niivue_viewer_mesh_validation_data_not_bytes():
    """Test that non-bytes 'data' in mesh raises ValueError."""
    meshes = [{'data': 'not bytes', 'name': 'lh.pial'}]
    
    with pytest.raises(ValueError, match="'data' must be bytes"):
        niivue_viewer(meshes=meshes, key="test_mesh_bad_data")


def test_niivue_viewer_mesh_validation_missing_name():
    """Test that missing 'name' in mesh raises ValueError."""
    meshes = [{'data': b'\x00' * 100}]
    
    with pytest.raises(ValueError, match="'name' field is required"):
        niivue_viewer(meshes=meshes, key="test_mesh_no_name")


def test_niivue_viewer_mesh_overlay_validation():
    """Test that mesh overlay validation works."""
    meshes = [{
        'data': b'\x00' * 100,
        'name': 'lh.pial',
        'overlays': [{'name': 'lh.thickness'}]  # missing 'data'
    }]
    
    with pytest.raises(ValueError, match="'data' field is required"):
        niivue_viewer(meshes=meshes, key="test_mesh_overlay_no_data")
