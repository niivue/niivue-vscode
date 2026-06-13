# @niivue/tauri

## 0.2.0

### Minor Changes

- aabde73: Add Tauri-based standalone desktop application for NiiVue medical image viewing with native filesystem access, recent files management, and cross-platform release workflow.

### Patch Changes

- 8e9e7dc: Detect extension-less DICOM files and open a whole series from one click.

  DICOM exports often have no extension (IM_0001) or a bare UID as the file
  name (1.2.840.113619...). These are now detected by content (the DICOM
  Part 10 magic: a 128-byte preamble followed by "DICM") instead of relying
  on the extension, and a single clicked DICOM file loads its entire series.
  - New `isDicomData()` helper exported from `@niivue/react`.
  - `loadVolume` content-sniffs payloads whose name matches no known format
    and routes matches through the DICOM loader. Multi-file input
    (`uri: string[]`) is now handled directly; previously an array URI threw
    before reaching the DICOM path, which also broke PWA folder drop.
  - When dcm2niix returns more than one series (a folder with multiple
    acquisitions), each additional series opens on its own canvas.
  - The VS Code extension expands a single opened DICOM file (by extension or
    by content, including extension-less files opened via "NiiVue: Open") to
    every DICOM file in its folder, so the full series loads together. The
    "Open DICOM Folder" path now sends a correct file array (it previously
    passed a single URI string alongside the data array).

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

- Updated dependencies [8e9e7dc]
- Updated dependencies [00880fa]
- Updated dependencies [4afacc9]
- Updated dependencies [dd0ab01]
- Updated dependencies [6ec393b]
  - @niivue/react@0.3.0
