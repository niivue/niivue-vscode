---
'@niivue/react': minor
'niivue': minor
'@niivue/jupyter': minor
'@niivue/streamlit': minor
'@niivue/tauri': minor
'@niivue/pwa': patch
---

Scene documents (NVDocument, `.nvd` and `.nvd.json`) work in every host, not only the web app.

- **Open**: a `.nvd` opens as a scene wherever an image opens: clicking it in the VS Code Explorer (a `.nvd.json` through right-click "NiiVue: Open"), double-clicking it in the JupyterLab file browser, the desktop app's Open File dialog, the installed web app's file handling, the `images` URL parameter, a drop on a tile, and in Streamlit by passing it with a `.nvd` file name.
- **Load**: NVDocument > Load shows the host's own open dialog in VS Code (which browses the workspace, remote ones included) and in JupyterLab, and a file picker elsewhere. In Streamlit, Load and file drops now work; before, they did nothing.
- **Save**: the NVDocument menu is no longer hidden in VS Code and JupyterLab. VS Code saves through its save dialog. JupyterLab writes the file into the workspace, asking for the path and suggesting the opened file's folder; this also applies to screenshots, which JupyterLab used to download through the browser. The desktop app saves through the native save dialog.
- **JSON**: Save as JSON writes NiiVue's own JSON document format, which other NiiVue-based tools read, and a sparse hand-written JSON scene that links its images by URL loads.
