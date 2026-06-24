# @niivue/tauri

## 0.2.0

### Minor Changes

- aabde73: Add Tauri-based standalone desktop application for NiiVue medical image viewing with native filesystem access, recent files management, and cross-platform release workflow.

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

- Updated dependencies [c4511cd]
- Updated dependencies [8e9e7dc]
- Updated dependencies [00880fa]
- Updated dependencies [274fa33]
- Updated dependencies [900a58d]
- Updated dependencies [1db38a8]
- Updated dependencies [909fd4f]
- Updated dependencies [4afacc9]
- Updated dependencies [900a58d]
- Updated dependencies [8e8d5f3]
- Updated dependencies [4ccaf11]
- Updated dependencies [dd0ab01]
- Updated dependencies [6ec393b]
- Updated dependencies [a3e3be2]
  - @niivue/react@1.0.0
