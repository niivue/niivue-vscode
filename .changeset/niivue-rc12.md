---
'@niivue/react': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Update the NiiVue core from `@niivue/niivue@1.0.0-rc.9` to `1.0.0-rc.12`.

Picks up the upstream fix for the WebGPU race condition (niivue/mono#61, closed
2026-08-03; rc.12 published 2026-08-10). No API changes were required on our side.

Note that rc.12 still rejects numpy's default 64-bit integer dtypes with
`Unsupported NPY dtype: <i8` / `<u8`, for `.npy` and `.npz` alike, so the
downcasting loader shim remains necessary.
