---
'@niivue/react': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Drop redundant GL refreshes after overlay and colorbar changes.

niivue v1's `setVolume` and `setMeshLayerProperty` assign the properties and refresh the GL
volume themselves, so the trailing `updateGLVolume()` calls in ScalingBox were redundant; the
mesh branch was refreshing twice outright. `addMeshLayer` likewise refreshes internally, so
setting the colorbar flag before the call removes another refresh. The view-mode toggles in
the menu now use `drawScene()`, which redraws without a full volume refresh.

Each removed call is one fewer `updateBindGroups` pass, the path implicated in the WebGPU
resize race (niivue/mono#61).
