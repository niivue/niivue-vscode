#!/usr/bin/env node
/**
 * scripts/migration/niivue-v1-scan.mjs
 *
 * Read-only scanner for the `@niivue/niivue` 0.68 -> 1.0 (niivue/mono) migration.
 *
 * v1.0 is a ground-up rewrite: the `Niivue` class became the default export
 * `NiiVueGPU`, most `setX(...)` methods became `x` accessor properties,
 * callbacks became DOM events, the data classes (`NVImage`/`NVMesh`/
 * `NVDocument`) are now plain types with no constructors or statics, and the
 * scene/graph/gl internals moved onto `nv.model`. See
 * docs/niivue-v1-migration.md for the full mapping.
 *
 * This script does NOT rewrite anything. Auto-rewriting the semantic changes
 * (method-call -> property-assignment, buffer -> File wrapping, mesh-layer
 * loading) is exactly the kind of "could be harmful" edit that the project
 * policy says needs a unit test first and manual confirmation after, so those
 * are done by hand. Instead this reports every remaining old-API usage with
 * its replacement, so you can (a) see the blast radius and (b) track progress
 * as files are migrated -- when it prints nothing, the source is clean.
 *
 * Usage:
 *   node scripts/migration/niivue-v1-scan.mjs            # human report
 *   node scripts/migration/niivue-v1-scan.mjs --json     # machine-readable
 *   node scripts/migration/niivue-v1-scan.mjs --ci       # exit 1 if any hits
 *
 * Scope: *.ts / *.tsx under apps/ and packages/, excluding build output and
 * node_modules. Matches inside comments are reported too (cheap, and a comment
 * referencing a removed symbol is usually worth updating as well).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SCAN_DIRS = ['apps', 'packages']
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'lib', '.turbo', 'coverage', 'static'])
const FILE_RE = /\.(ts|tsx)$/

/**
 * Each rule: a regex and the migration hint. `severity` is informational:
 *   'breaking' - will not compile against v1.0 (removed/renamed export or member)
 *   'rename'   - compiles maybe, but is the wrong API / wrong behaviour
 */
const RULES = [
  // ---- removed exports / classes ----
  { re: /\bNVMeshLoaders\b/, severity: 'breaking', hint: 'removed; load a mesh overlay via `await nv.addMeshLayer(meshIndex, { url: new File([data], name), colormap, calMin, calMax, colormapNegative, opacity })`' },
  { re: /\bNVImage\s*\.\s*loadFromUrl\b/, severity: 'breaking', hint: 'NVImage is a type now; use `await nv.addVolume({ url, name, colormap })` (url is string | File)' },
  { re: /\bNVMesh\s*\.\s*readMesh\b/, severity: 'breaking', hint: 'NVMesh is a type now; use `await nv.addMesh({ url: new File([data], name) })`' },
  { re: /\bNVDocument\b/, severity: 'breaking', hint: 'not re-exported in v1.0; import via `nv.loadDocument(string | File)` and `nv.serializeDocument(): Uint8Array` (CBOR). See docs §3.' },
  { re: /from ['"]@niivue\/niivue['"]/, severity: 'rename', hint: 'check imports: `Niivue` -> default `NiiVueGPU`; `NVImage`/`NVMesh` are type-only' },
  { re: /\bnew\s+Niivue\b|\bextends\s+Niivue\b|:\s*Niivue\b/, severity: 'breaking', hint: '`Niivue` removed; class is the default export `NiiVueGPU` (use `import NiiVue from ...`)' },

  // ---- removed / renamed instance methods ----
  { re: /\.loadImages\s*\(/, severity: 'breaking', hint: 'removed; use `nv.loadVolumes([...])`' },
  { re: /\.loadFromArrayBuffer\s*\(/, severity: 'breaking', hint: 'removed; `await nv.addVolume({ url: new File([buf], name) })`' },
  { re: /\.setSliceType\s*\(/, severity: 'rename', hint: 'property now: `nv.sliceType = t`' },
  { re: /\.setRadiologicalConvention\s*\(/, severity: 'rename', hint: 'property now: `nv.isRadiological = b`' },
  { re: /\.setInterpolation\s*\(/, severity: 'rename', hint: 'property now: `nv.volumeIsNearestInterpolation = b`' },
  { re: /\.setCrosshairWidth\s*\(/, severity: 'rename', hint: 'property now: `nv.crosshairWidth = w`' },
  { re: /\.setOpacity\s*\(/, severity: 'rename', hint: 'use `await nv.setVolume(i, { opacity })`' },
  { re: /\.removeVolumeByIndex\s*\(/, severity: 'breaking', hint: 'use `nv.model.removeVolume(i)` then `await nv.updateGLVolume()`' },
  { re: /\.getImageMetadata\s*\(/, severity: 'breaking', hint: 'removed; read `vol.hdr.dims[1..4]` / `vol.hdr.pixDims[1..3]` (utility.getImageMetadata helper)' },
  { re: /\.updateMesh\s*\(/, severity: 'breaking', hint: 'removed; mutate via `nv.setMesh(i, ...)` / `nv.setMeshLayerProperty(...)`' },
  { re: /\.setMeshLayerProperty\s*\(/, severity: 'rename', hint: 'signature changed: `(meshIndex, layerIndex, { camelCaseKey: value })` (e.g. isColorbarVisible, calMin, isColormapInverted)' },
  { re: /\.onLocationChange\s*=/, severity: 'rename', hint: "use `nv.addEventListener('locationChange', e => ...e.detail)`" },

  // ---- removed sub-objects / options ----
  { re: /\.dragModes\b/, severity: 'breaking', hint: 'removed; use the `DRAG_MODE` enum with `nv.primaryDragMode = DRAG_MODE.slicer3D|contrast`' },
  { re: /\.opts\.dragMode\b/, severity: 'breaking', hint: 'removed; `nv.primaryDragMode = DRAG_MODE.*`' },
  { re: /\.opts\.isColorbar\b/, severity: 'rename', hint: 'property now: `nv.isColorbarVisible`' },
  { re: /\bnv\w*\.gl\b/, severity: 'breaking', hint: 'no public WebGL context in v1.0 (WebGPU/WebGL2); drop the `gl` argument' },
  { re: /\bisResizeCanvas\b/, severity: 'breaking', hint: 'removed option (auto-resize via internal ResizeObserver)' },
  { re: /\bdragAndDropEnabled\b/, severity: 'rename', hint: 'renamed option: `isDragDropEnabled`' },
  { re: /\b(clipPlaneHotKey|viewModeHotKey)\b/, severity: 'breaking', hint: 'removed option (no built-in hotkeys); the app owns keyboard shortcuts' },
  { re: /\burlImgData\b/, severity: 'rename', hint: 'renamed option field: `urlImageData`' },
  { re: /\.cal_min\b|\.cal_max\b/, severity: 'rename', hint: 'on NVImage these are camelCase now: `calMin` / `calMax`' },
  { re: /\bmouseMoveListener\b/, severity: 'breaking', hint: 'overridable mouse handler removed; cross-canvas sync is `nv.broadcastTo(targets)`' },
]

function walk(dir, out) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (FILE_RE.test(name)) out.push(full)
  }
  return out
}

const files = []
for (const d of SCAN_DIRS) walk(join(REPO_ROOT, d), files)

const findings = []
for (const file of files.sort()) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        findings.push({
          file: relative(REPO_ROOT, file).replace(/\\/g, '/'),
          line: i + 1,
          severity: rule.severity,
          text: line.trim().slice(0, 120),
          hint: rule.hint,
        })
      }
    }
  })
}

const args = new Set(process.argv.slice(2))

if (args.has('--json')) {
  process.stdout.write(`${JSON.stringify(findings, null, 2)}\n`)
} else {
  let lastFile = ''
  for (const f of findings) {
    if (f.file !== lastFile) {
      process.stdout.write(`\n${f.file}\n`)
      lastFile = f.file
    }
    const tag = f.severity === 'breaking' ? 'BREAK' : 'RENAME'
    process.stdout.write(`  ${String(f.line).padStart(4)}  [${tag}] ${f.text}\n`)
    process.stdout.write(`        -> ${f.hint}\n`)
  }
  const breaking = findings.filter((f) => f.severity === 'breaking').length
  const rename = findings.length - breaking
  process.stdout.write(
    `\n${findings.length} usage(s) of the old @niivue/niivue API remain ` +
      `(${breaking} breaking, ${rename} rename) across ${new Set(findings.map((f) => f.file)).size} file(s).\n`,
  )
  if (findings.length === 0) {
    process.stdout.write('Clean - no old-API usages found. ✅\n')
  }
}

if (args.has('--ci') && findings.length > 0) process.exit(1)
