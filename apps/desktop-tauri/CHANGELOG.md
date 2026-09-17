# @niivue/tauri

## 0.2.0

### New features

- First release of NiiVue Desktop, a standalone viewer for Windows, macOS and Linux that opens files from your computer and remembers recently opened files. ([#146](https://github.com/niivue/niivue-vscode/pull/146))
- Show how to cite the NiiVue wrapper ecosystem paper: the **About** dialog and a new **Cite NiiVue VS Code** entry in the NiiVue logo menu give the reference, with buttons to copy it as text or BibTeX. After a screenshot is saved, a short note names the file and the paper to cite. ([#305](https://github.com/niivue/niivue-vscode/pull/305))
- Update the NiiVue core to 1.0 (release candidate). It renders with WebGPU where available and with WebGL2 elsewhere. ([#252](https://github.com/niivue/niivue-vscode/pull/252))
- Open NiiVue documents (`.nvd`, `.nvd.json`) like images: from the VS Code Explorer, the JupyterLab file browser, the desktop Open File dialog or the Streamlit component. **Save as JSON** writes the JSON document format that other NiiVue tools read. ([#304](https://github.com/niivue/niivue-vscode/pull/304))
- Add a **Screenshot** button that saves the visible tiles as a PNG figure at twice the screen resolution. With several tiles open, the dropdown can save only the selected tile. VS Code and JupyterLab ask where in the workspace to save it. ([#300](https://github.com/niivue/niivue-vscode/pull/300))
- Save the current scene as a NiiVue document (`.nvd`) from the new **NVDocument** menu, and open it again to restore its images and view settings. ([#235](https://github.com/niivue/niivue-vscode/pull/235))
- Open DICOM files that have no file extension. In VS Code, opening one DICOM file loads the whole series from its folder. ([#230](https://github.com/niivue/niivue-vscode/pull/230))
- Reorder images by dragging the grab strip at the top of a tile onto another tile. ([#107](https://github.com/niivue/niivue-vscode/pull/107))
- Open GraphML files (`.graphml`), such as vessel skeletons and brain networks, as a network of nodes and edges. ([#257](https://github.com/niivue/niivue-vscode/pull/257))
- Add **View > Tile Spacing** to set the gap between tiles, and fix the last tile spilling off screen when several images are open. ([#238](https://github.com/niivue/niivue-vscode/pull/238))

### Fixes and improvements

- The NiiVue logo in the menu bar opens **Reset Viewer** and **About**. ([#250](https://github.com/niivue/niivue-vscode/pull/250))
- Fix "Failed to load image" appearing at random when several images are opened in a row. ([#267](https://github.com/niivue/niivue-vscode/pull/267))
- Center the About and Header dialogs in the window.
- Fix keyboard shortcuts acting twice on the focused tile. The crosshair keys (`H`, `J`, `K`, `L`, `Ctrl+U`, `Ctrl+D`) move the crosshair in every selected tile. In VS Code, viewer shortcuts only work while the viewer has focus, so they no longer take keys typed into Quick Open or the Command Palette. ([#242](https://github.com/niivue/niivue-vscode/pull/242))
- Warn right away when a NIfTI image is too large to display (more than 2 GB uncompressed), instead of failing after a long load. ([#256](https://github.com/niivue/niivue-vscode/pull/256))
- Fix NumPy `.npy` and `.npz` files with 64-bit integers, NumPy's default, showing as black or corrupt images. ([#259](https://github.com/niivue/niivue-vscode/pull/259))
- Show the NiiVue brain logo as the app icon, the file icon and in the menu bar. ([#169](https://github.com/niivue/niivue-vscode/pull/169))
- Move the position and value readout to the bottom left of the tile, clear of the 4D controls and the timeseries graph, and keep its width steady while the crosshair moves. ([#243](https://github.com/niivue/niivue-vscode/pull/243))
- Show the file name on the tile label when only one image is open.
- Combine the image information and the crosshair position into one status bar at the bottom, and fix scrollbars that appeared after the menu bar changed size. ([#255](https://github.com/niivue/niivue-vscode/pull/255))
- Refresh the look of the menu bar and tiles. Menus that do not fit collapse into **More** instead of wrapping onto a second line. ([#151](https://github.com/niivue/niivue-vscode/pull/151))
- When WebGL2 is unavailable, the error on the tile explains that the graphics setup is the cause, not the file, and links to how to fix it. ([#251](https://github.com/niivue/niivue-vscode/pull/251))
- When the graphics backend fails to start, the error on the tile says which one failed. In the web app, `?backend=webgl2` forces WebGL2. ([#272](https://github.com/niivue/niivue-vscode/pull/272))
