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
