# Migrating to `@niivue/niivue` v1.0 (niivue/mono)

Status: **code-complete** (Phases 0-2) - core package + all apps migrated and green; pending manual confirmation.
Target: `@niivue/niivue@1.0.0-rc.9` (npm `next` tag). Last verified against rc.9 (2026-06).

This document is the single source of truth for the upgrade from `@niivue/niivue@0.68.2`
to the v1.0 release candidate published from the new [`niivue/mono`](https://github.com/niivue/mono)
monorepo. There is no official upstream migration guide; this is ours.

---

## 1. Why this is a big change

v1.0 is a **ground-up rewrite**, not an increment:

- **WebGPU/WebGL2 dual backend.** The default `@niivue/niivue` entry (`niivuegpu.js`)
  ships both backends and auto-selects WebGPU when available, falling back to WebGL2.
  Subpath entries `@niivue/niivue/webgpu` and `@niivue/niivue/webgl2` are backend-only.
  **Decision (2026-06): we use the default dual entry** - no import-path change, WebGPU
  where supported (modern PWA browsers), WebGL2 fallback elsewhere (incl. VS Code webviews).
- **MVC split.** State lives on `nv.model` (e.g. `nv.model.scene`, `nv.model.removeVolume`).
  The old top-level `nv.scene`, `nv.graph`, `nv.uiData`, `nv.gl`, `nv.otherNV`, `nv.dragModes`
  are gone.
- **Class renamed.** The default export is `NiiVueGPU`; the named `Niivue` export no longer exists.
- **Setter methods → accessor properties** (`nv.setSliceType(t)` → `nv.sliceType = t`, etc.).
- **Callbacks → DOM events.** `nv extends EventTarget`; `nv.onX = fn` is replaced by
  `nv.addEventListener('x', e => e.detail)`.
- **Data classes are now plain types.** `NVImage`/`NVMesh`/`NVMeshLayer`/`NVDocument` are
  `type` aliases - **no constructors, no static methods** (`NVImage.loadFromUrl`,
  `NVMesh.readMesh`, `NVMeshLoaders.readLayer`, `NVDocument.loadFromJSON` are all gone).
- **Functionality split into `@niivue/nv-ext-*` packages** (drawing, niimath, dcm2niix,
  image-processing, mrs, save-html). We don't use these yet; flagged as future opportunities.

### The one piece of good news: a single chokepoint

Almost all direct `@niivue/niivue` usage in this repo is funnelled through
**`packages/niivue-react`** (our Preact wrapper). The five apps consume `@niivue/react`,
not niivue directly. The only stray direct uses are a couple of `SLICE_TYPE` type-imports
in `apps/streamlit/...` and one direct `mesh.updateMesh(nv.gl)` in the Streamlit hook.
So the migration is mostly *one package*.

> We keep our own Preact `@niivue/react`. We do **not** adopt the official `@niivue/nvreact`
> (it is React 19; our wrapper is Preact + signals and carries Menu/Container/etc.). The
> official `nv-react` source is a useful reference for canonical new-API usage only.

---

## 2. API mapping (0.68 → 1.0.0-rc.9)

Every entry below is grounded in the shipped rc.9 `.d.ts` files. Cite line numbers from
`node_modules/.pnpm/@niivue+niivue@1.0.0-rc.9/.../dist/` when in doubt.

### 2.1 Imports & construction

| Old | New |
| --- | --- |
| `import { Niivue } from '@niivue/niivue'` | `import NiiVue from '@niivue/niivue'` (default export `NiiVueGPU`) |
| `import { NVImage, NVMesh } from '@niivue/niivue'` (values) | type-only: `import type { NVImage, NVMesh } from '@niivue/niivue'` |
| `import { NVMeshLoaders } from '@niivue/niivue'` | **removed** - see §2.4 |
| `import { NVDocument, type DocumentData } from '@niivue/niivue'` | **removed** - see §2.6 |
| `import { SLICE_TYPE } from '@niivue/niivue'` | unchanged (value export); also `DRAG_MODE`, `MULTIPLANAR_TYPE`, `SHOW_RENDER`, `NiiDataType` |
| `new Niivue(opts)` | `new NiiVueGPU(opts)` |

### 2.2 Constructor options (`NiiVueOptions` is now a flat bag)

| Old option | New |
| --- | --- |
| `isResizeCanvas: true` | **removed** (auto via internal ResizeObserver) - drop it |
| `dragMode: 1` | `primaryDragMode: DRAG_MODE.contrast` (`= 1`); optional `secondaryDragMode` |
| `dragAndDropEnabled: false` | `isDragDropEnabled: false` |
| `clipPlaneHotKey: ''` | **removed** (no built-in hotkey options remain) - drop it |
| `viewModeHotKey: ''` | **removed** - drop it |
| `isColorbar` | `isColorbarVisible` |

> **Keyboard note:** v1.0 removed the built-in clip-plane/view-mode hotkey options we
> previously set to `''` to silence niivue's own `c`/`v` handlers (issue #224). If niivue
> no longer registers those handlers, our app's `useKeyboardShortcuts` becomes the sole
> owner - a simplification. **To confirm during migration:** that rc.9 does not attach
> conflicting key listeners. See `[[niivue-vscode-keyboard-architecture]]`.

### 2.3 Class members: setter methods → properties

| Old | New |
| --- | --- |
| `nv.setSliceType(t)` | `nv.sliceType = t` |
| `nv.setRadiologicalConvention(b)` | `nv.isRadiological = b` |
| `nv.setInterpolation(!interp)` / `nv.opts.isNearestInterpolation` | `nv.volumeIsNearestInterpolation = b` |
| `nv.setCrosshairWidth(w)` | `nv.crosshairWidth = w` |
| `nv.opts.isColorbar = b` | `nv.isColorbarVisible = b` |
| `nv.opts.dragMode = nv.dragModes.slicer3D` | `nv.primaryDragMode = DRAG_MODE.slicer3D` |
| `nv.scene.pan2Dxyzmm` | `nv.pan2Dxyzmm` (or `nv.model.scene.pan2Dxyzmm`) |
| `nv.setClipPlane([az,el,depth])` | unchanged: `nv.setClipPlane(number[])` |
| `nv.moveCrosshairInVox(i,j,k)` | unchanged |
| `nv.drawScene()` | unchanged |
| `nv.createOnLocationChange()` | unchanged |

### 2.4 Loading volumes & meshes (the big one)

`url` in the new options types is **`string | File` only - not `ArrayBuffer`**. Any
in-memory buffer must be wrapped: `new File([buffer], nameWithExtension)`.

| Old | New |
| --- | --- |
| `const img = await NVImage.loadFromUrl({url, name, colormap}); nv.addVolume(img)` | `await nv.addVolume({ url, name, colormap })` (async; `url: string \| File`) |
| `await nv.loadImages([img])` | `await nv.loadVolumes([img])` (`loadImages` removed) |
| `await nv.loadFromArrayBuffer(buf, uri)` | `await nv.addVolume({ url: new File([buf], uri), name: uri })` |
| `const m = await NVMesh.readMesh(data, uri, nv.gl); nv.addMesh(m)` | `await nv.addMesh({ url: new File([data], uri), name: uri })` |
| `await nv.loadMeshes(list)` | unchanged |
| `nv.useLoader(mnc2nii, 'mnc', 'nii')` | unchanged (`useLoader(converter, fromExt, toExt)`) |
| `NVMeshLoaders.readLayer(uri, data, mesh, opacity, cmap, cmapNeg, useNeg, calMin, calMax)` | `await nv.addMeshLayer(meshIndex, { url: new File([data], uri), opacity, colormap: cmap, colormapNegative: cmapNeg, calMin, calMax })` (set `colormapNegative` non-empty to enable the negative map) |

### 2.5 Volume/mesh mutation

| Old | New |
| --- | --- |
| `nv.setOpacity(i, o)` | `await nv.setVolume(i, { opacity: o })` |
| `nv.volumes[i].colormap = c; nv.updateGLVolume()` | `await nv.setVolume(i, { colormap: c })` |
| `nv.removeVolumeByIndex(i)` | `nv.model.removeVolume(i); await nv.updateGLVolume()` |
| `nv.setMeshLayerProperty(meshId, layerNo, 'cal_min', v)` | `await nv.setMeshLayerProperty(meshIndex, layerNo, { calMin: v })` - first arg is **index**, last is an **options object** with camelCase keys |
| layer key `colorbarVisible` | `isColorbarVisible` |
| layer key `colormapInvert` | `isColormapInverted` |
| layer key `cal_min` / `cal_max` | `calMin` / `calMax` |
| layer key `useNegativeCmap: true` | set `colormapNegative` to a non-empty colormap name |
| `mesh.updateMesh(nv.gl)` | **removed** - mutate via `nv.setMesh(i, …)` / `setMeshLayerProperty(…)` |

### 2.6 4D frames, events, document, metadata

| Old | New |
| --- | --- |
| `nv.setFrame4D(nv.volumes[0].id, f)` | unchanged signature `setFrame4D(id: string, f)` but **async** now |
| `nv.onLocationChange = fn` | `nv.addEventListener('locationChange', e => fn(e.detail))` |
| `nv.onVolumeUpdated = fn` (our field) | keep as our own field, or use `addEventListener('volumeLoaded', …)` |
| frame-change hook | `nv.addEventListener('frameChange', e => …e.detail.frame)` (`{volume, frame}`) |
| `vol.cal_min` / `vol.cal_max` | `vol.calMin` / `vol.calMax` |
| `vol.getImageMetadata()` → `{nx,ny,nz,nt,dx,dy,dz}` | **removed** - read `vol.hdr.dims[1..4]` and `vol.hdr.pixDims[1..3]`; we add a local `getImageMetadata(vol)` helper in `utility.ts` |
| `NVDocument.loadFromJSON(json).then(d => nv.loadDocument(d))` | `nv.loadDocument(source: string \| File)` |
| `nv.json()` (serialize scene) | `nv.serializeDocument(): Uint8Array` (**CBOR**, not JSON) |
| `nv.broadcastTo(targets)` | unchanged (2nd `SyncOpts` arg optional; default `{'2d':true,'3d':true}`) |
| `ExtendedNiivue.mouseMoveListener` override (manual pan sync) | **delete** - `broadcastTo` handles 2D/3D sync natively |

---

## 3. Open decision: the `.nvd` / Viewer-Host Protocol document format

The just-landed VHP Phase 1a (`.nvd` scene import/export) is tightly coupled to the old
`NVDocument` JSON API, which v1.0 removed:

- Import was `NVDocument.loadFromJSON(jsonObject)`; v1.0 only exposes
  `nv.loadDocument(string | File)`.
- Export was `nv.json()` returning a plain object; v1.0 only exposes
  `nv.serializeDocument()` returning a **CBOR `Uint8Array`**.
- The Phase-0 golden test (`document-roundtrip.test.ts`) calls `NVDocument.loadFromJSON`
  and `.json()` directly and will not compile.

This is a **format change (JSON → CBOR)**, not just a rename, and it intersects the active
Viewer-Host Protocol initiative (which "adopts NVDocument serialization as-is").

**Decision (2026-06): CBOR-native, with a JSON form for authoring.** niivue's native
serialization is CBOR (`nv.serializeDocument()` / `nv.loadDocument(File)`), and that is what
`SceneDocument` carries (a `Uint8Array`). We additionally support a **JSON form of the same v1
document** so scenes can be hand-authored in an editor (e.g. VS Code) and viewed directly. See
"JSON `.nvd` support" below. Consequences we accept:
- `@niivue/viewer-protocol`'s `SceneDocument` is opaque CBOR bytes (`Uint8Array`); the Phase-0
  golden test round-trips through `serializeDocument()` / `loadDocument()` instead of
  `NVDocument.loadFromJSON()` / `.json()`.
- The *legacy 0.x* JSON `.nvd` schema (`encodedImageBlobs`/`sceneData`/`opts`) is NOT read - it
  is a different schema from v1's `NVDocumentData`. Only the v1-schema JSON form is supported.

### JSON `.nvd` support (`nvd-json.ts`)
niivue v1 has no JSON path (`loadDocument` -> `NVLoader.fetchFile` -> `NVDocument.deserialize`,
which is `cbor-x.decode` only). Because the wire object is a plain `NVDocumentData`, we transcode
at our own seam:
- **Read:** `parseNvd` sniffs the bytes; a JSON `.nvd` (starts with `{`/`[`) is `JSON.parse`d,
  binary `{ $bin: base64 }` wrappers are revived to `Uint8Array`, niivue-required fields
  (`scene`/`clipPlanes`/`volumes`/`meshes`) are defaulted (so a sparse
  `{ "volumes": [{ "url": "...", "colormap": "gray" }] }` loads), then re-encoded to plain CBOR
  (`Encoder({ useRecords: false })`) that niivue's `decode` reads. CBOR bytes pass through.
- **Write:** "Save Scene -> Scene as JSON (.nvd.json)" decodes `serializeDocument()` and emits
  readable JSON (`Uint8Array` -> `{ $bin: base64 }`). It re-opens through the read path.
- `isNvdFile` accepts `.nvd` and `.nvd.json`. URL-referencing scenes have no binary fields, so
  their JSON is small and editable; self-contained scenes round-trip losslessly via `$bin`.
- Guarded by `nvd-json.test.ts` (GL-free): JSON->CBOR->decode equality, `$bin` round-trip,
  default-filling, and the format sniff. cbor-x added as a dep (matches niivue's `^1.6.0`).

---

## 4. Plan & status

### Phase 0 - Foundation ✅ (this change)
- [x] Bump `@niivue/niivue` to `1.0.0-rc.9` across all 5 manifests; `pnpm install` clean
      (only an unrelated `vite` peer warning; sibling loaders have no niivue peer dep).
- [x] This migration document.
- [x] `scripts/migration/niivue-v1-scan.mjs` - a read-only scanner that reports every
      remaining old-API usage with its replacement (run it to track progress).
- [x] Changeset (`major` for `@niivue/react`).

### Phase 1 - Migrate `packages/niivue-react` + `@niivue/viewer-protocol` ✅ (code complete; pending manual PWA confirmation)
All of the following landed and the package gate is green (type-check, build, 140 tests):
- [x] `utility.ts` - `getImageMetadata` helper; `Niivue` → `NiiVue`.
- [x] `events.ts` - `ExtendedNiivue` slimmed: **`mouseMoveListener` override deleted**
      (sync is `broadcastTo`); `setFrame4D` override replaced by a `'frameChange'` listener
      in `NiiVueCanvas`; options renamed (`primaryDragMode`/`isDragDropEnabled`).
- [x] Setter→property renames across `NiiVueCanvas.tsx`, `Menu.tsx`, `ScalingBox.tsx`, `Nav4D.tsx`.
- [x] Loader rewrites → `addVolume`/`loadVolumes`/`addMesh` with `File` wrapping (extension
      handling preserved).
- [x] Mesh-overlay layer → `addMeshLayer`; `setMeshLayerProperty` new `(idx, idx, {opts})` shape.
- [x] Event wiring (`addEventListener('locationChange'|'frameChange')`) + async `attachToCanvas`.
- [x] Document path → CBOR (`serializeDocument()` / `loadDocument(File)`); `SceneDocument` = `Uint8Array`.
- [x] JSON `.nvd` support: `nvd-json.ts` transcodes JSON<->CBOR (hand-authorable scenes + "Save
      Scene -> Scene as JSON"); read path sniffs and transcodes; cbor-x dep added.
- [x] Tests: `Menu.test.tsx` mocks reworked; `document-roundtrip.test.ts` rewritten GL-free;
      new `niivue-v1-api.test.ts` characterization tests for the 3 riskiest transforms.

**Awaiting manual confirmation in the PWA** (could not be auto-verified without a GL context):
each load path (NIfTI / DICOM series / MINC / MHD+`.raw` / mesh / mesh-overlay), first-volume
render after async attach, the `.nvd` Save→load round-trip (CBOR and the new JSON form: open a
hand-written `.nvd.json`, and Save Scene → Scene as JSON → reopen), cross-canvas 2-up sync, and the
"Multiplanar + Render" vs "+ Timeseries" layouts (`autoSizeMultiplanar`/`multiplanarForceRender`
had no clean v1 equivalent; mapped to `isGraphVisible` + graph accessors).

### Phase 2 - Apps (code complete; pending manual smoke verification)
- [x] PWA, Tauri, Jupyter, VS Code (`niivue`) type-check + build clean - they inherit through
      `@niivue/react` with no direct niivue breakage. The VS Code app bundles `@niivue/react`'s
      `dist` into its webview (`build:webview`), built against the migrated package.
- [x] `apps/streamlit/.../useStreamlitNiivue.ts` (the one file with direct niivue usage):
      `import { Niivue }` removed (instances infer as `ExtendedNiivue`);
      `nv.removeVolume(obj)` → `nv.model.removeVolume(i)` + `updateGLVolume()`;
      `nv.removeMesh(obj)` → `nv.model.removeMesh(i)` + `updateGLVolume()`;
      mesh-layer clear `mesh.layers = []; mesh.updateMesh(nv.gl)` → `nv.removeMeshLayer(0, i)`
      loop (recomposites colors); `nv.onLocationChange = fn` (dead under `as any` in v1) →
      `addEventListener('locationChange', ...)`, with the voxel-click payload extracted to
      `buildVoxelClickPayload` and unit-tested.
- Whole-monorepo gate green: `turbo type-check` 8/8; all TypeScript tests pass (`@niivue/react`
      146, streamlit frontend 13, tauri 22, ...); `pnpm versions:check` (syncpack) clean.
      (`@niivue/streamlit`'s Python `pytest` job is unrelated and only fails locally for want of
      an installed `pytest`.)

Still pending: **manual smoke verification** of each app (esp. the Streamlit voxel-click
feedback to Python and overlay/mesh-overlay reloads).

### Phase 3 - Opportunities unlocked (not required)
- Drop the `mouseMoveListener` sync hack (done in Phase 1) - already an `nv-ext`-free win.
- Consider `@niivue/nv-ext-*` packages where we hand-roll equivalents.
- Re-evaluate the VHP `SceneDocument` against niivue's new document/web-bridge contract.

---

## 5. Verifying the migration

```bash
# enumerate remaining old-API usages anywhere in the repo
node scripts/migration/niivue-v1-scan.mjs

# package gate (run from repo root)
pnpm --filter @niivue/react type-check
pnpm --filter @niivue/react test
pnpm --filter @niivue/react build

# manual confirmation: load a volume, a mesh, a 4D series, an overlay, and
# (if migrated) a .nvd scene in the PWA; confirm cross-canvas sync on a 2-up layout.
```

The dependency is pinned to the exact `1.0.0-rc.9` during the migration to avoid surprise
RC bumps. Relax to `^1.0.0` once niivue v1.0 GA ships.
