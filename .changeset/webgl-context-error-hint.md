---
'@niivue/react': patch
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Explain WebGL2-context failures in the on-canvas error instead of only showing the raw message.

When a WebGL2 context cannot be created, niivue throws "unable to get WebGL context. Maybe the browser doesn't support WebGL2.", which already surfaces in the on-canvas error panel. On its own that message reads like a corrupt file, when it is actually an environment issue (no hardware acceleration, e.g. the VS Code snap build, missing GPU drivers, or recent Chromium dropping the automatic SwiftShader fallback).

- The error panel now detects this specific message and appends a short note clarifying it is an environment/GPU issue, not the file, with a "How to fix" link to issue #236. Every app that mounts the shared viewer inherits this.
- The VS Code extension README gains a Troubleshooting section with the recommended fix (restore hardware acceleration) and the temporary `enable-unsafe-swiftshader` workaround.
