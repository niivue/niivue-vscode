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
- NiiVue's built-in `c` (clip plane) and `v` (view mode) hotkeys are disabled so the app's own handler is the single source of truth. The focused canvas is no longer acted on twice (#224). Note: the menu-less unstyled Streamlit embed has no app keyboard handler, so it loses NiiVue's built-in `c`/`v` hotkeys.
