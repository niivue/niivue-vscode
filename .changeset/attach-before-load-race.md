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
(GPU device, buffers, pipelines) afterwards, while `updateGLVolume` guards on
`nv.view` alone and `NVViewGPU.updateBindGroups` guards on `device` alone before
dereferencing `buffers.lineStorage` - which `_createResources()` assigns last.
Every load therefore raced GPU init, and a volume whose upload landed in the
window between "device created" and "resources created" threw. Large or slow
volumes on a page with many live canvases flip enough of those races to be
visible.

- `NiiVueCanvas` keeps the attach promise on the instance (`nv.attached`) and
  gates both GPU-touching load paths (`nv.body` and `nv.documentData`) behind it.
- The gate waits for attach to *settle*, not to succeed. Attach legitimately
  fails where no GPU is usable (headless Chromium exposes `navigator.gpu` but
  returns a null adapter, so niivue stays on WebGPU and throws "Failed to get
  WebGPU adapter"; it only auto-falls back to WebGL2 when `navigator.gpu` is
  absent entirely). Loading anyway is the long-standing behaviour there -
  without a device `updateBindGroups()` returns at its own guard and the volume
  simply never reaches the GPU. The failure is logged instead of swallowed.
- New unit tests `NiiVueCanvasAttachGate` assert `addVolume` is not called until
  the attach promise settles, and that a rejected attach still loads without
  reporting a load error; `vitest.config.ts` aliases the `dcm2niix-worker`
  virtual module so components pulling in the DICOM loader are unit-testable.
