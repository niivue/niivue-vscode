---
'@niivue/react': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Add a `?backend=webgl2` escape hatch for browsers that advertise WebGPU but cannot render.

niivue v1 only falls back to WebGL2 when `navigator.gpu` is absent. A blocklisted or software
adapter, a driver bug, or exhausted limits still passes that check, then fails at the first
render with `createBindGroup ... Required member is undefined`, which surfaced as a blank canvas
in the PWA while the WebGL2-backed VS Code webview drew the same files fine.

`?backend=webgl2` and `?backend=webgpu` now force a backend, so an affected user has a way to
view their data and support has a way to confirm the cause. The attach error names the backend
that failed and points at the override. `opts.backend` is otherwise left to niivue, so the
default path is unchanged.
