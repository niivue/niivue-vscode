# @niivue/viewer-protocol

## 0.2.0

### Minor Changes

- dd0ab01: Add `.nvd` (NiiVue NVDocument) scene import/export, and the Viewer-Host Protocol foundation it runs on.

  This is Phase 1a of the Viewer-Host Protocol (VHP): a transport-agnostic contract
  so any niivue-based UI can run on any compliant host. It introduces the repo's
  first use of NiiVue's `NVDocument` serialization.
  - New `@niivue/viewer-protocol` package: the protocol contract (types only, no
    runtime deps) - a `call`/`result`/`event` envelope (wire-compatible with
    niivue/mono's `@niivue/web-bridge`), a `HostCapabilities` shape, the
    `SceneDocument` type (NVDocument, adopted as-is), and the `ViewerClient` interface.
  - `@niivue/react` implements `ViewerClient` via `createViewerClient(appProps)`:
    `applyDocument` (import a `.nvd`), `getDocument` (export the active canvas),
    a minimal `applyPatch`, and `on(...)` events. The existing `{ type, body }`
    message bus is untouched - the facade is additive.
  - A new `loadDocument` message imports a `.nvd` into a fresh canvas; dropping a
    `.nvd` onto the shared `ImageDrop`, or picking one via "Add Image", routes
    through it. Both gzip-compressed and uncompressed `.nvd` files are read.
  - A "Save Scene" menu entry exports the active canvas as a downloaded `.nvd`
    (browser hosts; gated by the new `menuItems.saveScene`).
  - Proven end-to-end on the PWA (Playwright: export then re-import via drop) and
    guarded by a GL-free NVDocument round-trip golden test (VHP Phase 0).

  Scope: single-canvas import/export, embedded `.nvd`. The live capability
  handshake, host-services RPC, and the full JSON-Patch engine arrive with the
  second transport (VS Code, Phase 1b).

### Patch Changes

- 909fd4f: Upgrade the NiiVue core to the v1.0 release candidate (`@niivue/niivue@1.0.0-rc.9`,
  from the new `niivue/mono` monorepo).

  This is a breaking dependency change. v1.0 is a WebGPU/WebGL2 rewrite: the `Niivue`
  class became the default export `NiiVueGPU`, most setter methods became accessor
  properties, callbacks became DOM events, the data classes (`NVImage`/`NVMesh`/
  `NVDocument`) are now plain types with no constructors or statics, and scene/gl
  internals moved onto `nv.model`. We adopt the default dual-backend entry, so WebGPU is
  used where available (modern PWA browsers) and WebGL2 elsewhere (incl. VS Code webviews).

  The migration is centralised in `@niivue/react`; the apps inherit it through that package.

  Scene documents (`.nvd`) use niivue v1's native CBOR serialization. On top of that, a JSON
  form of the same v1 document is supported: a JSON `.nvd`/`.nvd.json` can be hand-authored in
  an editor and opened directly (transcoded to CBOR on load), and "Save Scene" offers a "Scene
  as JSON" export. Embedded binary is carried as `{ $bin: base64 }`; URL-referencing scenes are
  plain, editable JSON.
