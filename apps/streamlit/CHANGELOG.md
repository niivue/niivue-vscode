# @niivue/streamlit

## 0.3.0

### Minor Changes

- 27432cf: Add mesh surface support to the Streamlit component. Users can now display FreeSurfer surface files (pial, white, inflated), GIfTI, MZ3, STL, OBJ, and other mesh formats via the new `meshes` parameter. Mesh overlays (curvature, thickness, annotations) are also supported. Fix mesh binary data loading in niivue-react's loadVolume function.

### Patch Changes

- 23028fd: shift+drop adds files as overlays to the last canvas instead of creating new ones
  overlay handler resolves index -1 to last canvas with bounds check
  HeaderBox now uses signal effect instead of stale useEffect dependency
  added onVolumeUpdated callback to ExtendedNiivue, called after load
- 79610b8: Initial configuration for automated independent releases via Changesets.
- 85211c5: Add `update_interval_ms` parameter to `niivue_viewer()`. Passing `None`
  disables click/drag feedback to Python entirely, restoring the low-latency
  behaviour of the pre-overlay viewer. Defaults to `100` (current throttle).
