"""Unit tests for component utilities."""

import base64
import pytest


def test_base64_encoding():
    """Test base64 encoding of binary data."""
    sample_data = b'\x00\x01\x02\x03'
    encoded = base64.b64encode(sample_data).decode()
    
    # Verify encoding
    assert isinstance(encoded, str)
    assert len(encoded) > 0
    
    # Verify decoding
    decoded = base64.b64decode(encoded)
    assert decoded == sample_data


def test_empty_data_encoding():
    """Test encoding of empty data."""
    empty_data = b''
    encoded = base64.b64encode(empty_data).decode()
    
    assert encoded == ''


def test_large_data_encoding():
    """Test encoding of larger data."""
    large_data = b'\xFF' * 10000
    encoded = base64.b64encode(large_data).decode()
    
    # Base64 should be roughly 1.33x the size
    assert len(encoded) > len(large_data)
    
    # Verify roundtrip
    decoded = base64.b64decode(encoded)
    assert decoded == large_data
