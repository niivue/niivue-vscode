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
2026-08-03; rc.12 published 2026-08-10).

The numpy int64/uint64 support added in #90 is now applied by converting the buffer
before handing it to NiiVue, rather than by registering a converter through
`nv.useLoader`. As of rc.12 a registered `.npy` converter is not reached before the
built-in reader throws `Unsupported NPY dtype: <i8`, so the registration silently
stopped taking effect. Converting up front is independent of how NiiVue resolves its
readers, and the output is still a `.npy` that NiiVue's own reader parses.
