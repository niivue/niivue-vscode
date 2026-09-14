---
'@niivue/react': minor
'niivue': minor
'@niivue/jupyter': minor
'@niivue/tauri': patch
'@niivue/streamlit': patch
'@niivue/pwa': patch
---

Make it easy to find how to cite NiiVue.

- The brand menu has a **Cite NiiVue** entry on every host, embedded Streamlit included. It opens a dialog with the reference for the NiiVue wrapper ecosystem paper and buttons to copy it as text or BibTeX.
- After a screenshot is saved, a short note names the file and the paper to cite, without blocking the viewer. In the web app, the desktop app and Streamlit it appears at the bottom of the viewer for ten seconds (the desktop app shows the saved path). VS Code's and JupyterLab's own "saved" notices carry the same hint; VS Code now shows the saved path relative to the workspace.
