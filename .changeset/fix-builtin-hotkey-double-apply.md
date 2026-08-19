---
'@niivue/react': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Stop keyboard shortcuts being applied twice (#224).

niivue v1 still ships built-in hotkeys and binds them to `window` during
`attachToCanvas`, so `c` advanced the clip plane once via niivue and once more via
the app's own shortcut hook. The app broadcasts to every selected canvas and is the
intended single source of truth, so niivue's listener is now removed once attach has
installed it.

This affects anyone with a working GPU. It was not caught earlier because the e2e
suite runs on headless CI where `attachToCanvas` always rejects, so niivue's listener
was never registered there.
