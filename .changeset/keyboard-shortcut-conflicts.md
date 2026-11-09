---
'@niivue/react': patch
'niivue': patch
---

Fix keyboard shortcuts acting twice on the focused tile. The crosshair keys (`H`, `J`, `K`, `L`, `Ctrl+U`, `Ctrl+D`) move the crosshair in every selected tile. In VS Code, viewer shortcuts only work while the viewer has focus, so they no longer take keys typed into Quick Open or the Command Palette.
