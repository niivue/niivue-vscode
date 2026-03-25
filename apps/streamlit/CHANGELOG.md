# @niivue/streamlit

## 0.3.0

### Minor Changes

- 27432cf: Add mesh surface support to the Streamlit component. Users can now display FreeSurfer surface files (pial, white, inflated), GIfTI, MZ3, STL, OBJ, and other mesh formats via the new `meshes` parameter. Mesh overlays (curvature, thickness, annotations) are also supported. Fix mesh binary data loading in niivue-react's loadVolume function.

### Patch Changes

- 79610b8: Initial configuration for automated independent releases via Changesets.
