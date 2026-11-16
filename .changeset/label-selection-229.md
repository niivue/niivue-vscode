---
'@niivue/react': minor
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
---

Add per-label visibility controls for segmentation and atlas images (#229).

Integer label maps (base image or overlay) get a "labels" entry in the
ColorScale colormap dropdown. Selecting it renders the image as color-coded
labels and reveals a "Labels" button that opens a panel of per-label
checkboxes; selecting any normal color scale switches back to continuous
rendering. Highlights:

- Offered only for integer NIfTI images; when the image has no color table,
  one is built from the data's distinct values
- Per-label checkboxes with color swatches, search and select all / none, and
  incremental loading for large atlases (100+ labels)
- Works across multiple open files: the color table is built from the union of
  label values across the selected canvases, so atlases with different label
  ranges each render correctly, and the panel lists every file's labels
- Toggling rewrites the color-table alpha and applies to every selected canvas

Labels are opt-in via the dropdown and are not auto-applied when the popup
opens.
