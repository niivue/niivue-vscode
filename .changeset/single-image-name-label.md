---
'@niivue/react': patch
'niivue': patch
'@niivue/pwa': patch
'@niivue/jupyter': patch
'@niivue/streamlit': patch
'@niivue/tauri': patch
---

Show the file name on the tile label when only one image is open. The label shows the part that tells several open images apart, which left a single image with an empty label box; a lone image now shows its file name, and no label box is drawn when there is no name.
