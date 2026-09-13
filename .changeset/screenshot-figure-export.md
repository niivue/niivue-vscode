---
'@niivue/react': minor
'niivue': minor
'@niivue/pwa': patch
'@niivue/jupyter': patch
'@niivue/streamlit': patch
'@niivue/tauri': patch
---

Add a **Screenshot** button to the viewer menu bar that saves the visible tiles as a PNG figure.

- Clicking the label captures all tiles as they are laid out on screen, at the display's pixel density, with the gaps between them filled with the viewer background. The dropdown offers **All tiles** and, when more than one tile is shown, **Selected tile**. Only the rendered images are captured; overlays such as the tile name and the POS/VAL readout are not.
- The file is named after the active image (`<name>_screenshot.png`, or `niivue_screenshot.png`) and carries PNG text metadata: `Software` names NiiVue Viewer and `Comment` asks to cite the NiiVue wrapper ecosystem paper, with its DOI.
- The web app, the desktop app and the Streamlit component download the file. VS Code opens a save dialog in the opened file's folder and writes through the workspace file system, so remote sessions work too. JupyterLab downloads the file from the JupyterLab page.
- The button shows once a volume or mesh is loaded. Hosts can hide it with `menuItems.screenshot: false`.
