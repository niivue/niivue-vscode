---
'@niivue/react': major
'@niivue/viewer-protocol': patch
'@niivue/pwa': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Upgrade the NiiVue core to the v1.0 release candidate (`@niivue/niivue@1.0.0-rc.9`,
from the new `niivue/mono` monorepo).

This is a breaking dependency change. v1.0 is a WebGPU/WebGL2 rewrite: the `Niivue`
class became the default export `NiiVueGPU`, most setter methods became accessor
properties, callbacks became DOM events, the data classes (`NVImage`/`NVMesh`/
`NVDocument`) are now plain types with no constructors or statics, and scene/gl
internals moved onto `nv.model`. We adopt the default dual-backend entry, so WebGPU is
used where available (modern PWA browsers) and WebGL2 elsewhere (incl. VS Code webviews).

The migration is centralised in `@niivue/react`; the apps inherit it through that package.
See `docs/niivue-v1-migration.md` for the full old->new API mapping and the phased plan.

Scene documents (`.nvd`) use niivue v1's native CBOR serialization. On top of that, a JSON
form of the same v1 document is supported: a JSON `.nvd`/`.nvd.json` can be hand-authored in
an editor and opened directly (transcoded to CBOR on load), and "Save Scene" offers a "Scene
as JSON" export. Embedded binary is carried as `{ $bin: base64 }`; URL-referencing scenes are
plain, editable JSON.
