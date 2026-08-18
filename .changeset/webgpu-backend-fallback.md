---
'@niivue/react': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Fall back to WebGL2 when a browser advertises WebGPU but cannot actually render.

niivue v1 selects WebGPU whenever `navigator.gpu` exists, but that check only proves the
API is present. A blocklisted or software adapter, a driver bug, or exhausted limits can
still fail at the first real render with `createBindGroup ... Required member is undefined`,
which surfaced as a blank canvas in the PWA while the WebGL2-backed VS Code webview drew the
same files fine.

Attach now probes for a usable adapter and device before committing to WebGPU, and catches a
failing WebGPU attach to re-attach on WebGL2. The resolved backend is cached for the session,
so later canvases skip a backend already known to be broken. `?backend=webgl2` and
`?backend=webgpu` force a backend for support and debugging.
