"""MHD pair demo — load sphere.mhd + sphere.raw via the paired_data parameter."""
import streamlit as st
from niivue_component import niivue_viewer
from pathlib import Path

st.set_page_config(layout="wide", page_title="NiiVue — MHD")
st.title("🧠 MHD detached-header demo")
st.caption("Passes sphere.mhd as nifti_data and sphere.raw as paired_data.")

repo_root = Path(__file__).resolve().parents[2]
mhd_path = repo_root / "apps" / "pwa" / "test" / "assets" / "sphere.mhd"
raw_path = repo_root / "apps" / "pwa" / "test" / "assets" / "sphere.raw"

for p in (mhd_path, raw_path):
    if not p.exists():
        st.error(f"Required file {p} not found.")
        st.stop()

mhd_bytes = mhd_path.read_bytes()
raw_bytes = raw_path.read_bytes()
st.info(
    f"Loaded {mhd_path.name} ({len(mhd_bytes)} bytes) + "
    f"{raw_path.name} ({len(raw_bytes)/1024:.0f} kB)"
)

niivue_viewer(
    nifti_data=mhd_bytes,
    paired_data=raw_bytes,
    filename=mhd_path.name,
    height=600,
    view_mode="multiplanar",
    key="mhd",
)
