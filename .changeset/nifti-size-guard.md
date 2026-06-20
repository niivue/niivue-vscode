---
'@niivue/react': minor
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Warn upfront when a NIfTI volume is too large to display instead of failing slowly.

A single ArrayBuffer / WebGL texture is capped at ~2 GB in browser engines, so a
volume whose uncompressed voxel data exceeds that previously failed with "Array
buffer allocation failed" (VS Code) or rendered as garbage with blur/sobel shader
errors (online viewer) after a long load. We now read just the NIfTI header,
decide the uncompressed size, and show an actionable "Image too large to display"
warning before any allocation. See niivue/niivue-vscode#228.

- New `@niivue/react` helpers (`niftiTooLargeWarning`, `niftiVoxelByteLength`,
  `inflateGzipHeader`, `isNiftiName`, `MAX_VOLUME_BYTES`) compute a volume's
  uncompressed voxel byte length from its header.
- `.nii.gz` is handled by inflating only the leading bytes of the gzip stream, so
  the check uses the true uncompressed size rather than the compressed file size.
- The browser file picker / drag-and-drop guard (`buildImageMessageBodies`) peeks
  the header via `file.slice()` and never reads the multi-GB file at all.
- A universal guard in `loadVolume` covers every other host - in-memory buffers
  (Jupyter, Streamlit, VS Code binary) and URL streams (VS Code local files,
  fetched header-only and aborted) alike.
