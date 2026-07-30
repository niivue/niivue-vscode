---
'@niivue/react': patch
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Fix intermittent "Failed to load image" when adding several images in a row.

Loading the same volume repeatedly (or a batch of files) could leave a random
subset of tiles showing "Failed to load image" while the rest rendered fine. The
real error, visible only in the console, was
`createBindGroup ... 'buffer' ... Required member is undefined`.

`NiiVueCanvas` started `attachToCanvas()` and `loadVolume()` from two independent
effects in the same mount commit, so nothing sequenced them. In niivue v1
`attachToCanvas` assigns `nv.view` synchronously and only awaits `view.init()`
afterwards, while `updateGLVolume` guards on `nv.view` alone and
`NVViewGPU.updateBindGroups` guards on `device` alone before dereferencing
`buffers.lineStorage` - which `_createResources()` assigns last. Every load
therefore raced GPU init, and one whose upload landed between "device created"
and "resources created" threw. Slow volumes and many live canvases flip enough
of those races to be visible. See niivue/mono#61.

Loads now wait on the attach promise. The gate waits for attach to *settle*, not
to succeed, so a machine with no usable GPU keeps loading as before (headless
Chromium exposes `navigator.gpu` but returns a null adapter, so niivue stays on
WebGPU and throws; without a device the volume simply never reaches the GPU).
