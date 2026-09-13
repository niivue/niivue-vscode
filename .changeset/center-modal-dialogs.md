---
'@niivue/react': patch
'@niivue/pwa': patch
'@niivue/tauri': patch
'niivue': patch
'@niivue/jupyter': patch
'@niivue/streamlit': patch
---

Center the About and Header dialogs in the viewport.

Tailwind v4's preflight resets every element's margin, including the browser's default `margin: auto` that centers a modal `<dialog>`, so both dialogs opened pinned to the top-left corner.
