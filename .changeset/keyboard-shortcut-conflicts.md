---
'@niivue/react': patch
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Fix two keyboard-handling conflicts.

- The VS Code shortcut keybindings (1-5, r, i, b, x, etc.) now require keyboard focus to be in the viewer rather than only requiring the NiiVue tab to be active. They no longer swallow keystrokes meant for the Quick Open box or command palette (#223).
- NiiVue's own window keyboard handler is removed once a canvas is attached, so the app's shortcut handler is the single source of truth and a key such as `c` (clip plane) no longer acts on the focused canvas twice (#224). The app handles NiiVue's default keys with the same mapping and applies them to every selected canvas: `H`/`L`/`J`/`K` step the crosshair (or turn the camera in the 3D render view) and `Ctrl+U`/`Ctrl+D` move it superior/inferior. Note: the menu-less unstyled Streamlit embed has no app keyboard handler, so it no longer responds to these keys.
