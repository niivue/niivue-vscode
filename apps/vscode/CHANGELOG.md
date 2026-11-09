# Change Log

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

## 2.7.0

### Added

- New 4D navigation panel.
- Improved error handling in canvas with descriptive error messages.
- Added support for `.mnc` files in JupyterLab extension.

### Fixed

- Fixed double loading issue for images where files would open twice.
