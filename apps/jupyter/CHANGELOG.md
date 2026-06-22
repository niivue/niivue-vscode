# @niivue/jupyter

## 0.2.8

### Patch Changes

- c4511cd: Fold the Home button into the brand, and turn "Save Scene" into an NVDocument Save/Load split button.
  - The standalone "Home" menu-bar button is gone. On standalone hosts (web, desktop)
    the niivue logo + wordmark is now a dropdown: **Reset Viewer** (the old Home
    action) and **About** (a dialog with the app's purpose, NiiVue + NeuroDesk
    credits, the data-privacy note, and the build version linking to its commit).
    The brand stays static on embedded hosts (VS Code; Streamlit, which sets
    `menuItems.home: false`), so their behavior is unchanged.
  - "Save Scene" is renamed **NVDocument** and gains a chevron: clicking the label
    still saves the active scene as a `.nvd` by default, while the dropdown offers
    **Save** and a new **Load** (a `.nvd` file picker, complementing drag-and-drop).
  - Hosts can pass an optional `appInfo` ({ version, buildDate, repoUrl }) to
    `Menu`; the PWA wires in its build-time git metadata. The About dialog degrades
    gracefully (omits the version line) when a host supplies none.
  - The standalone home screens (PWA and desktop) now share a `HomeSection`
    primitive for consistent styling while keeping their host-specific copy (PWA:
    install / bookmarklet / update; desktop: native Open File). Both drop their
    "Data Privacy" section, and the PWA also drops its version footer, since the
    brand menu's About dialog now carries that information.

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

- 274fa33: Fix two keyboard-handling conflicts.
  - The VS Code shortcut keybindings (1-5, r, i, b, x, etc.) now require keyboard focus to be in the viewer rather than only requiring the NiiVue tab to be active. They no longer swallow keystrokes meant for the Quick Open box or command palette (#223).
  - NiiVue's built-in `c` (clip plane) and `v` (view mode) hotkeys are disabled so the app's own handler is the single source of truth. The focused canvas is no longer acted on twice (#224). Note: the menu-less unstyled Streamlit embed has no app keyboard handler, so it loses NiiVue's built-in `c`/`v` hotkeys.

- 1db38a8: Warn upfront when a NIfTI volume is too large to display instead of failing slowly.

  A single ArrayBuffer / WebGL texture is capped at ~2 GB in browser engines, so a
  volume whose uncompressed voxel data exceeds that previously failed with "Array
  buffer allocation failed" (VS Code) or rendered as garbage with blur/sobel shader
  errors (online viewer) after a long load. We now read just the NIfTI header,
  decide the uncompressed size, and show an actionable "Image too large to display"
  warning before any allocation. See niivue/niivue-vscode#228.
  - New `@niivue/react` helpers (`niftiTooLargeWarning`, `niftiVoxelByteLength`,
    `inflateGzipHeader`, `isNiftiName`, `MAX_VOLUME_BYTES`) compute a volume's
    uncompressed voxel byte length from its header.
  - `.nii.gz` is handled by inflating only the leading bytes of the gzip stream, so
    the check uses the true uncompressed size rather than the compressed file size.
  - The browser file picker / drag-and-drop guard (`buildImageMessageBodies`) peeks
    the header via `file.slice()` and never reads the multi-GB file at all.
  - A universal guard in `loadVolume` covers every other host - in-memory buffers
    (Jupyter, Streamlit, VS Code binary) and URL streams (VS Code local files,
    fetched header-only and aborted) alike.

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

- 4afacc9: Modernise app icons across the monorepo.
  - **PWA**: switch to `@vite-pwa/assets-generator` (integrated `pwaAssets` mode) and refresh the master. Replaces the legacy 200×200 grayscale brain with the canonical 512×512 neon brand icon (downscaled from the 1024×1024 master at `niivue/niivue`). Generated icons (favicon.ico, pwa-64/192/512, maskable-512, apple-touch-180) ship in 256-color palette mode for ~5× smaller distribution size, and the manifest now uses correct per-purpose icons instead of the old `purpose: 'any maskable'` on an unpadded transparent PNG.
  - **VS Code extension**: replace the 200×200 marketplace icon with a 128×128 `icon.png` (the VS Code spec) downsized from `apps/pwa/public/logo.png`, and the 200×200 language file-type icon with a 32×32 transparent `language-icon.png` downsized from the existing transparent-contrast PNG. Drop the now-unused `niivue/*.png` rules from `.vscodeignore`.
  - **JupyterLab extension**: ship a 32×32 transparent `style/niivue-icon.png` directly under `style/`, decoupling `.jp-NiivueFileIcon` from the `build:assets` rsync chain. The CSS reference becomes `url('./niivue-icon.png')`.
  - **Top bar (`@niivue/react`)**: the menu-bar brand mark now shows the neon brain logo in place of the placeholder "N", so the canonical icon also appears in-app. The mark is embedded as a base64 data URI in `packages/niivue-react/src/assets/niivue-logo.ts` (a ~3.3 KB 96×96 palette downscale of the master), so it type-checks and renders identically across every consumer that builds this package from source or from `dist` (PWA, Streamlit, VS Code webview, JupyterLab) with no extra asset request.
  - Drop the legacy 200×200 duplicates from `apps/vscode/`, `apps/jupyter/`, and the orphaned icons + favicon from `packages/niivue-react/public/`.

- 8e8d5f3: Fix canvas tile layout overflow and add an adjustable tile spacing control.

  The grid that arranges the viewer canvases sized each tile too generously: it
  subtracted only a single gap per axis and ignored both the 1px tile border and
  the wrapper margin. With several images open the last tile no longer fit on the
  row, so it either spilled past the right edge or wrapped into a second row that
  was cut off at the bottom.
  - `getCanvasSize` now budgets every consumer of space explicitly (the wrapper
    margin, the per-tile border, and the correct `(n-1)` inter-tile gaps), so the
    computed tiles always fit the viewport. The packing math moved to a dedicated,
    unit-tested `layout.ts`.
  - New **View > Tile Spacing** control adjusts the gap between canvases, backed by
    a persisted `tileSpacing` setting (default 4px).
  - PWA: normalize the Windows backslash path in the Tailwind `content` glob so the
    `@niivue/react` source is scanned on Windows too (its utility classes were
    silently dropped from local Windows builds).

- 4ccaf11: Compact the viewer top bar, unify the status readout, and drive every app icon from a single committed master.
  - **Top bar (VS Code).** Wire the previously-unused `.nv-form-vscode` density tokens onto the webview so the bar drops from 48px to 36px. The brand mark keeps its size; only the empty space above and below it shrinks.
  - **One status strip.** A new shared `StatusBar` merges the image-metadata line (formerly under the top bar) and the crosshair `mm` readout (formerly a separate footer) into one slim bottom strip, used across the VS Code, PWA, desktop, and Streamlit hosts. The global mm readout now populates on load even if NiiVue's initial location event fires before the canvas selection is initialized (previously it could stay blank until the first crosshair move).
  - **Scrollbar fix.** The canvas now sizes off a `ResizeObserver` on its container instead of only `window.onresize`, so a menu-bar reflow (overflow into "More", the status strip toggling) no longer leaves a stale, oversized canvas with scrollbars on both axes.
  - **Icons.** Every app icon (VS Code file-type + marketplace, Jupyter, Tauri, PWA, and the in-app viewer logo) is now generated from one committed master, `branding/niivue-icon.png`, via `pnpm generate:icons`. The file-type and viewer icons become a transparent neon mark (no more dark tile); generated outputs are gitignored and rebuilt by each app's build. The one committed generated file, `niivue-logo.ts`, stamps the master's hash so CI catches drift.

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

- a3e3be2: Explain WebGL2-context failures in the on-canvas error instead of only showing the raw message.

  When a WebGL2 context cannot be created, niivue throws "unable to get WebGL context. Maybe the browser doesn't support WebGL2.", which already surfaces in the on-canvas error panel. On its own that message reads like a corrupt file, when it is actually an environment issue (no hardware acceleration, e.g. the VS Code snap build, missing GPU drivers, or recent Chromium dropping the automatic SwiftShader fallback).
  - The error panel now detects this specific message and appends a short note clarifying it is an environment/GPU issue, not the file, with a "How to fix" link to issue #236. Every app that mounts the shared viewer inherits this.
  - The VS Code extension README gains a Troubleshooting section with the recommended fix (restore hardware acceleration) and the temporary `enable-unsafe-swiftshader` workaround.

## 0.2.7

### Patch Changes

- e98248f: Add monorepo-aware test coverage reporting with Vitest v8 coverage for all packages, Playwright V8 coverage via monocart-reporter for e2e tests, and a coverage aggregation script that produces a unified HTML report and per-package summary table.
- 23028fd: shift+drop adds files as overlays to the last canvas instead of creating new ones
  overlay handler resolves index -1 to last canvas with bounds check
  HeaderBox now uses signal effect instead of stale useEffect dependency
  added onVolumeUpdated callback to ExtendedNiivue, called after load
- a4517f2: Extend MHD detached-header support beyond the VS Code extension. The PWA, Jupyter and Streamlit apps now resolve a `.mhd` header's `ElementDataFile` reference and fetch (or forward) the paired `.raw` voxel data: PWA via drag/drop and `?images=` URL auto-fetch, Jupyter via the Contents API in the iframe, Streamlit via a new `paired_data` Python argument. When the paired raw file is missing or the reference is unsafe (path traversal, nested dirs), a clear "Missing paired data file…" warning is surfaced in the existing on-canvas error overlay instead of a silent black render. The VS Code path also rejects non-sibling references for consistency.
- 13147d5: Fix MHD files loading as a black image. MHD is a detached format where voxel data lives in a separate `.raw` file referenced by `ElementDataFile` in the header. NiiVue's URL-based loader does not auto-detect the paired `.raw` URL for MHD files, so the extension now parses the header, resolves the raw file URI, and passes it to the webview as `urlImgData` (URL path) or `pairedData` (binary-data path). The webview forwards `urlImgData` to NiiVue's `loadImages` call and uses a Blob URL to load `pairedData` when binary buffers are provided.
- 79610b8: Initial configuration for automated independent releases via Changesets.
