# Change Log

## 2.10.0

### Minor Changes

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

### Patch Changes

- 00880fa: Add drag-and-drop reordering for loaded images.
  - New `reorderImages<T>()` helper in `@niivue/react/utility` and a
    `reorder(fromIndex, toIndex)` callback wired through `Container` to each
    `Volume`.
  - When the UI is fully visible (`hideUI > 2`), a thin grab strip appears at
    the top of each canvas; drag a volume onto another to insert it at the
    drop target's position.
  - Drags use a custom MIME type (`application/x-niivue-reorder`) so the
    existing file-import drop path is unaffected.

  Mouse-only for now; keyboard reorder is a follow-up.

- 4afacc9: Modernise app icons across the monorepo.
  - **PWA**: switch to `@vite-pwa/assets-generator` (integrated `pwaAssets` mode) and refresh the master. Replaces the legacy 200×200 grayscale brain with the canonical 512×512 neon brand icon (downscaled from the 1024×1024 master at `niivue/niivue`). Generated icons (favicon.ico, pwa-64/192/512, maskable-512, apple-touch-180) ship in 256-color palette mode for ~5× smaller distribution size, and the manifest now uses correct per-purpose icons instead of the old `purpose: 'any maskable'` on an unpadded transparent PNG.
  - **VS Code extension**: replace the 200×200 marketplace icon with a 128×128 `icon.png` (the VS Code spec) downsized from `apps/pwa/public/logo.png`, and the 200×200 language file-type icon with a 32×32 transparent `language-icon.png` downsized from the existing transparent-contrast PNG. Drop the now-unused `niivue/*.png` rules from `.vscodeignore`.
  - **JupyterLab extension**: ship a 32×32 transparent `style/niivue-icon.png` directly under `style/`, decoupling `.jp-NiivueFileIcon` from the `build:assets` rsync chain. The CSS reference becomes `url('./niivue-icon.png')`.
  - **Top bar (`@niivue/react`)**: the menu-bar brand mark now shows the neon brain logo in place of the placeholder "N", so the canonical icon also appears in-app. The mark is embedded as a base64 data URI in `packages/niivue-react/src/assets/niivue-logo.ts` (a ~3.3 KB 96×96 palette downscale of the master), so it type-checks and renders identically across every consumer that builds this package from source or from `dist` (PWA, Streamlit, VS Code webview, JupyterLab) with no extra asset request.
  - Drop the legacy 200×200 duplicates from `apps/vscode/`, `apps/jupyter/`, and the orphaned icons + favicon from `packages/niivue-react/public/`.

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

## 2.9.0

### Minor Changes

- 62ecdef: Add keyboard shortcuts

### Patch Changes

- e98248f: Add monorepo-aware test coverage reporting with Vitest v8 coverage for all packages, Playwright V8 coverage via monocart-reporter for e2e tests, and a coverage aggregation script that produces a unified HTML report and per-package summary table.
- 23028fd: shift+drop adds files as overlays to the last canvas instead of creating new ones
  overlay handler resolves index -1 to last canvas with bounds check
  HeaderBox now uses signal effect instead of stale useEffect dependency
  added onVolumeUpdated callback to ExtendedNiivue, called after load
- a4517f2: Extend MHD detached-header support beyond the VS Code extension. The PWA, Jupyter and Streamlit apps now resolve a `.mhd` header's `ElementDataFile` reference and fetch (or forward) the paired `.raw` voxel data: PWA via drag/drop and `?images=` URL auto-fetch, Jupyter via the Contents API in the iframe, Streamlit via a new `paired_data` Python argument. When the paired raw file is missing or the reference is unsafe (path traversal, nested dirs), a clear "Missing paired data file…" warning is surfaced in the existing on-canvas error overlay instead of a silent black render. The VS Code path also rejects non-sibling references for consistency.
- 13147d5: Fix MHD files loading as a black image. MHD is a detached format where voxel data lives in a separate `.raw` file referenced by `ElementDataFile` in the header. NiiVue's URL-based loader does not auto-detect the paired `.raw` URL for MHD files, so the extension now parses the header, resolves the raw file URI, and passes it to the webview as `urlImgData` (URL path) or `pairedData` (binary-data path). The webview forwards `urlImgData` to NiiVue's `loadImages` call and uses a Blob URL to load `pairedData` when binary buffers are provided.
- 932d631: Fix **Add Image** / **Add Overlay** silently failing on VS Code Remote-SSH (and any session where the picked file sits outside `localResourceRoots`). Centralise the URL-vs-binary decision in a new `uriToImageBody` helper used by every load entry point, harden `isUriAccessible` to match on scheme + authority + path (so a `file://` workspace can't claim to host a `vscode-remote://` file in single-file mode), and fall back to `vscode.workspace.fs.readFile` whenever `webview.asWebviewUri` can't serve the file.
- 79610b8: Initial configuration for automated independent releases via Changesets.

## [2.6.2] - 2026-02-02

### Added

- New 4D navigation panel.
- Improved error handling in canvas with descriptive error messages.
- Added support for `.mnc` files in JupyterLab extension.

### Fixed

- Fixed double loading issue for images where files would open twice.

## [Unreleased]

- Initial release
