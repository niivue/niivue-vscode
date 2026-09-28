# Improvement backlog

Findings from a repository review in September 2026 that are not fixed yet.
Each item names the files involved; line numbers are approximate and drift as
the code changes. Items marked _(not re-checked)_ come from a code review and
were not reproduced; confirm them before starting.

Fixed on the `claude/repository-improvement-analysis-i5xusc` branch: JPEG 2000
and JPEG-LS DICOM decoding and the leaked dcm2niix workers, signal effects
started on every render, NiiVue instances kept after closing a tile, the VS
Code webview CSP blocking fonts, Jupyter unit tests that could not fail CI, and
the Streamlit package's MIT license and Python floor.

## Bugs users can hit

- [ ] **VS Code: "Open web link" is probably broken.** `uriToImageBody` in
      `apps/vscode/src/editorProvider.ts` passes `https://` URIs to
      `workspace.fs.readFile`, which has no https provider, and nothing catches
      the error, so the panel stays blank. The webview CSP `connect-src` does
      not allow `https:` either. Check by hand in VS Code first. Fix: fetch in
      the extension host and post the bytes, and report failures.
- [ ] **VS Code: opening a folder can exhaust the extension host's memory.**
      The fallback in `openDcmFolder` reads every file in the folder at once
      with `Promise.all`, with no size or count limit. Checking an
      extension-less file for DICOM reads the whole file to look at 4 bytes,
      and a clicked `.dcm` is read twice. Fix: `stat()` first, limit the
      fallback to DICOM-like names, cap the count and warn.
- [ ] **VS Code: `localResourceRoots` is too broad.** It is the parent of the
      first workspace folder, or `/` without a folder (`createPanel` and
      `resolveCustomEditor`). In a multi-root workspace, files in another
      folder get a webview URI that is then refused. `isUriAccessible` matches
      path prefixes without a separator boundary. Fix: all workspace folders
      plus the opened file's folder, checked the same way in both places.
- [ ] **VS Code: command palette entries that fail.** `niiVue.openFromExplorer`
      reads `items[0]` before checking `items` (`extension.ts`), so it throws
      when run from the palette. The 18 shortcut commands registered at the
      top of `extension.ts` do nothing when run from the palette. Fix: forward
      them to the active panel, or hide them with `menus.commandPalette`.
- [ ] **VS Code: errors are swallowed.** `createOrShow`,
      `createOrShowDcmFolder`, `createCompareView`, `resolveCustomEditor` and
      the `addOverlay` / `addImages` / `addDcmFolder` handlers have no
      `catch`, so failures leave an empty viewer. Compare calls `readFile` on
      a selected folder, and it skips `sendMhdMessage`, so a detached `.mhd`
      fails there.
- [ ] **Large saves fail.** Files the webview saves (NVDocument, screenshots)
      travel as base64 (`packages/niivue-react/src/document.ts` and `atob` in
      the extension), which needs about 4 times the file size in memory and
      throws above roughly 400 MB. Post the `Uint8Array` directly.
- [ ] **VS Code: every panel uses `retainContextWhenHidden: true`,** so each
      hidden tab keeps its WebGL context and volume data.
- [ ] **VS Code: activation and hover.** `activationEvents: ["*"]` activates
      the extension on every startup. The hover provider is registered for
      every language, rejects when there is no link instead of returning
      `undefined`, and its local path pattern drops directories
      (`data/sub-01/T1w.nii.gz` becomes `/T1w.nii.gz`).
- [ ] **Streamlit: a new image under the same `key` adds a tile.** When
      `nifti_data` changes and the key stays, `useStreamlitNiivue` calls
      `initCanvas`, which appends a NiiVue instance, so the previous image
      stays next to the new one, and overlays still go to the first tile
      (`nvArray.value[0]`). Seen in Streamlit 1.64: two canvases after
      switching images. A key per image avoids it.
- [ ] **Tile indices go stale after removing or reordering** _(not
      re-checked)_. `Volume.tsx` registers its location listener once with the
      first `volumeIndex`, and `remove` / `swap` / `insertAt` do not remap
      `selection` or `syncedIndices`.
- [ ] **Dropping files on a loaded tile skips MHD pairing and the NIfTI size
      guard** _(not re-checked)_. The drop handler in `Volume.tsx` duplicates
      `ImageDrop.tsx` without `buildImageMessageBodies`.
- [ ] **Message handling swallows errors** _(not re-checked)_. Rejections of
      `handleMessage` are not caught (`main.tsx`, `listenToMessages` in
      `events.ts`); fetches are not checked for `ok`; `replaceMeshOverlay`
      removes the old layer before fetching the new one; `?images=` fills
      tiles in completion order; `loadDicomSeries` renames `.ima` to `.dcm`
      before fetching the URL.
- [ ] **`postMessage` listeners accept messages from any window** _(not
      re-checked)_ (`listenToMessages` in `events.ts`, `main.tsx`). A page
      that opens or frames the PWA can make it load arbitrary URLs.
- [ ] **`viewer-protocol` adapter** _(not re-checked)_. `documentChanged` is
      emitted before the load finishes, `getDocument` returns the selected
      tile rather than the one `applyDocument` added, `ViewerClient` has no
      `dispose`, and several exports are unused.

## CI and process

- [ ] **Run the desktop app's Rust tests in CI.**
      `apps/desktop-tauri/src-tauri/src/lib.rs` has 8 unit tests, including
      the file-access allowlist, and no workflow runs `cargo`. Add
      `cargo fmt --check`, `cargo clippy` and `cargo test` (needs the GTK and
      WebKitGTK development packages on Ubuntu).
- [ ] **Enforce formatting.** `pnpm format:check` fails on about 90 files.
      husky and lint-staged are installed but there is no `.husky/` directory
      or `prepare` script. CI runs neither `format:check` nor
      `versions:check`. The Streamlit frontend's `lint` script only echoes
      "Lint passed". Format once in its own commit, then add the checks.
- [ ] **gh-pages preview cleanup loses runs.** `cleanup_pwa_preview.yml`,
      `cleanup_coverage_preview.yml`, `coverage_report.yml` and
      `deploy_pwa_preview.yml` share the concurrency group
      `gh-pages-mutation`, and GitHub cancels older queued runs in a group
      (the cleanup for #310 was cancelled). gh-pages holds about 32 PWA
      previews and 22 coverage reports of closed PRs.
      `deploy_pwa_production.yml` pushes to the same branch under the group
      `pages`. Fix: a scheduled sweep that deletes `pr-N` folders of closed
      PRs, and one group for everything that pushes to gh-pages.
- [ ] **The production PWA deploy builds current `main`,** not the commit CI
      tested: `deploy_pwa_production.yml` checks out without
      `ref: ${{ github.event.workflow_run.head_sha }}`.
- [ ] **Turbo can replay a stale test result.** `test.inputs` in `turbo.json`
      leave out `test/**/*.tsx` and `vitest.config.ts`; the desktop and PWA
      apps have `.tsx` tests. Use `$TURBO_DEFAULT$`.
- [ ] **Enable `eslint-plugin-react-hooks`.** It is installed but not in
      `eslint.config.js`. Enabling it reports rules-of-hooks errors in
      `ScalingBox.tsx` (hooks after an early return) and exhaustive-deps
      warnings.
- [ ] **Align the pinned pnpm with the lockfile.** `packageManager` pins pnpm
      10.18.3, but the lockfile was written by a newer pnpm 10 (it has `libc`
      fields), so an install with the pinned version rewrites unrelated lines.
- [ ] **CI job setup.** Test jobs get build output through `actions/cache`
      without `fail-on-cache-miss`; seven jobs repeat the same setup steps (a
      composite action would do); `pull_request: branches: ['*']` does not
      match base branches containing `/`; most jobs have no
      `timeout-minutes`. The Streamlit job runs its tests twice, once plain
      and once for coverage with `continue-on-error`.

## Packaging and bundle size

- [ ] **Load the dcm2niix worker on demand.** Every host's main chunk carries
      the worker and its WASM as about 1.3 MB of base64; the PWA precache
      limit had to go up to 4,000,000 bytes for it. A dynamic import would
      keep it out of the initial load, but check it under the VS Code and
      Jupyter CSPs. The unused `worker.jpeg` asset that `@niivue/dcm2niix`
      references is still emitted too (1.4 MB with its map in the VS Code
      package).
- [ ] **`@niivue/react` package fields** _(not re-checked)_.
      `exports["./components"]` points to a file that is not built, the
      `types` condition comes after `import`, and `sideEffects` claims only
      CSS while some modules add window listeners at import. No app uses
      `dist/`, so `test` depending on a full library build costs time.
- [ ] **`computed()` in component bodies** (Menu, StatusBar, ScalingBox,
      Volume, MenuBar) creates new computeds on every render. Switch to
      `useComputed` only where the callback reads nothing but signals: Menu's
      computeds read `nv.volumes`, which changes without a signal update.

## Cleanup and docs

- [ ] Delete the unused root `.vscodeignore` (it describes an old `niivue/`
      layout) and `apps/vscode/enh.dcm` (a copy of the PWA test asset); add
      `coverage/` to `apps/vscode/.vscodeignore` and drop its stale entries.
- [ ] ESLint 10 ignores `.eslintignore` (its `**/public/**out` line is also
      two patterns joined), and the `ignores` in `eslint.config.js` are not
      global because that block also sets `files`.
- [ ] Replace `npm-run-all` (unmaintained, needs two overrides in the root
      `package.json`) with `concurrently` in `apps/jupyter`.
- [ ] Update `DEVELOPMENT.md`, `MONOREPO.md` and
      `.github/copilot-instructions.md`: they leave out the desktop app and
      `viewer-protocol` and give Node 18 / pnpm 8 while CI uses Node 22 /
      pnpm 10. The root `tsconfig.json` references leave out the desktop,
      Jupyter and Streamlit projects.
- [ ] Remove dead code: `WebviewCollection` and `NiiVueDocument.onDidDispose`
      in the VS Code extension, `noOp` in `Menu.tsx`, unused exports in
      `events.ts`.
- [ ] Declare `pnpm.onlyBuiltDependencies` so installs stop warning about
      ignored build scripts.
- [ ] VS Code CSP: try `'wasm-unsafe-eval'` instead of `'unsafe-eval'`, and
      generate the nonce with `crypto.getRandomValues`.
- [ ] Python metadata: `jupyterlab_niivue` allows Python 3.8 and lists
      classifiers up to 3.12; the Streamlit classifiers stop at 3.11 while CI
      tests 3.12.
- [ ] `@niivue/niivue` is pinned to `1.0.0-rc.13`; newer release candidates
      are out.
- [ ] Vite configs use `__dirname` and an import without extension, which the
      planned native config loader will reject.
- [ ] Close or refresh the old Copilot drafts #113, #128, #134 and #135.

## Test gaps

- [ ] VS Code: `extension.ts` and `document.ts` have no tests;
      `resolveMhdPairedRawUri` (the path guard for `.mhd` data files),
      `openDcmFolder` and the compare view are untested.
- [ ] `@niivue/react`: `Volume.tsx`, `Nav4D.tsx`, `ImageDrop.tsx` and
      `hooks/index.ts` have no coverage; the file-type dispatch in
      `NiiVueCanvas.tsx` is barely tested.
