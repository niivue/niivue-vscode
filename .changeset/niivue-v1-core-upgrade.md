---
'@niivue/react': major
'@niivue/viewer-protocol': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': minor
'@niivue/jupyter': minor
'@niivue/tauri': patch
---

Upgrade the NiiVue core to the v1.0 release candidate (`@niivue/niivue@1.0.0-rc.13`,
from the new `niivue/mono` monorepo).

This is a breaking dependency change. v1.0 is a WebGPU/WebGL2 rewrite: the `Niivue`
class became the default export `NiiVueGPU`, most setter methods became accessor
properties, callbacks became DOM events, the data classes (`NVImage`/`NVMesh`/
`NVDocument`) are now plain types with no constructors or statics, and scene/gl
internals moved onto `nv.model`. We adopt the default dual-backend entry, so WebGPU is
used where available (modern PWA browsers) and WebGL2 elsewhere (incl. VS Code webviews).

The migration is centralised in `@niivue/react`; the apps inherit it through that package.

Scene documents (`.nvd`) use NiiVue v1's native CBOR serialization, and its JSON form works
too: the NVDocument menu offers a "Save as JSON" export in NiiVue's JSON document format, and a
JSON `.nvd`/`.nvd.json` opens directly, including a sparse scene hand-authored in an editor that
links its images by URL (the fields NiiVue requires are filled in on load).
