#!/usr/bin/env node
/**
 * scripts/release/encode-prerelease-versions.mjs
 *
 * Post-processor for `pnpm changeset version --snapshot beta`. For each
 * published app whose package.json was bumped by changesets (detected by the
 * "-beta-<id>" suffix changesets writes), strip the suffix to recover the
 * intended next-stable version, then re-encode it for its target's version
 * format using the CI run number as the unique build identifier.
 *
 * Packages NOT bumped by changesets are skipped — re-encoding their current
 * version as `<stable>.dev<run>` would produce a PEP 440 release that sorts
 * BELOW the already-published stable, which pip would happily install
 * downgrade-style for users on `--pre`.
 *
 * Conventions:
 *   - VS Code Marketplace requires bare `M.m.p`. Pre-releases live on an
 *     odd minor strictly greater than the next-stable minor:
 *       next-stable 2.10.0 → pre 2.11.<run>
 *       next-stable 2.9.0  → pre 2.11.<run>   (skip same-minor collision)
 *   - PyPI requires PEP 440. We use `.devN` (development release) so plain
 *     `pip install <pkg>` ignores it; only `pip install --pre` picks it up.
 *     Next-stable 0.3.0 → 0.3.0.dev<run>.
 *   - package.json holds a semver-compatible mirror (`<base>-dev.<run>`) so
 *     pnpm/turbo/changesets keep parsing the manifest. The authoritative
 *     PyPI version is written to pyproject.toml.
 *
 * Outputs:
 *   prerelease-targets.json — { vscode, jupyter, streamlit } booleans, used
 *     by the workflow to gate per-target publish steps.
 *
 * Usage:
 *   node scripts/release/encode-prerelease-versions.mjs <run_number>
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const runNumber = process.argv[2]
if (!runNumber || !/^\d+$/.test(runNumber)) {
  console.error('Usage: encode-prerelease-versions.mjs <run_number>')
  process.exit(1)
}

const SNAPSHOT_RE = /-beta-/

const readPkg = (relPath) =>
  JSON.parse(readFileSync(path.join(repoRoot, relPath), 'utf8'))

const writePkgVersion = (relPath, newVersion) => {
  const abs = path.join(repoRoot, relPath)
  const pkg = JSON.parse(readFileSync(abs, 'utf8'))
  pkg.version = newVersion
  writeFileSync(abs, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  ${relPath}: ${newVersion}`)
}

// Did `changeset version --snapshot beta` actually bump this package?
// changesets only bumps packages that have a changeset directly or transitively.
const wasBumped = (relPath) => SNAPSHOT_RE.test(readPkg(relPath).version)

const stripSnapshot = (version) => version.replace(/-beta-.*$/, '')

// Next odd minor STRICTLY greater than the next-stable's minor.
//   even minor n → n+1   (n=8 → 9)
//   odd  minor n → n+2   (n=9 → 11)
const toVscodePreRelease = (nextStable) => {
  const [major, minor] = nextStable.split('.').map(Number)
  const preMinor = minor + 1 + (minor % 2)
  return `${major}.${preMinor}.${runNumber}`
}

const toPep440Dev = (nextStable) => `${nextStable}.dev${runNumber}`
const toSemverDev = (nextStable) => `${nextStable}-dev.${runNumber}`

// Override pyproject.toml's version statically. For jupyter, this also
// removes `version` from `[project].dynamic` so hatch-nodejs-version does
// not try to derive it from the semver-formatted package.json.
const overridePyprojectVersion = (relPath, devVersion) => {
  const abs = path.join(repoRoot, relPath)
  let toml = readFileSync(abs, 'utf8')

  // Insert or replace the `version = "..."` line under [project].
  if (/^version\s*=/m.test(toml)) {
    toml = toml.replace(/^version\s*=.*/m, `version = "${devVersion}"`)
  } else {
    toml = toml.replace(
      /^(name\s*=\s*"[^"]+")/m,
      `$1\nversion = "${devVersion}"`,
    )
  }

  // Remove "version" from `dynamic = [...]` if present.
  toml = toml.replace(
    /^dynamic\s*=\s*\[\s*"version"\s*,\s*/m,
    'dynamic = [',
  )

  writeFileSync(abs, toml)
  console.log(`  ${relPath}: ${devVersion}`)
}

console.log(`Encoding pre-release versions (run #${runNumber}):`)

const targets = { vscode: false, jupyter: false, streamlit: false }

// ── VS Code extension ───────────────────────────────────────────────────────
if (wasBumped('apps/vscode/package.json')) {
  const nextStable = stripSnapshot(readPkg('apps/vscode/package.json').version)
  writePkgVersion('apps/vscode/package.json', toVscodePreRelease(nextStable))
  targets.vscode = true
} else {
  console.log('  apps/vscode: no changeset bump, skipping')
}

// ── JupyterLab extension ────────────────────────────────────────────────────
if (wasBumped('apps/jupyter/package.json')) {
  const nextStable = stripSnapshot(readPkg('apps/jupyter/package.json').version)
  writePkgVersion('apps/jupyter/package.json', toSemverDev(nextStable))
  overridePyprojectVersion('apps/jupyter/pyproject.toml', toPep440Dev(nextStable))
  targets.jupyter = true
} else {
  console.log('  apps/jupyter: no changeset bump, skipping')
}

// ── Streamlit component ─────────────────────────────────────────────────────
if (wasBumped('apps/streamlit/package.json')) {
  const nextStable = stripSnapshot(readPkg('apps/streamlit/package.json').version)
  writePkgVersion('apps/streamlit/package.json', toSemverDev(nextStable))
  overridePyprojectVersion('apps/streamlit/pyproject.toml', toPep440Dev(nextStable))
  targets.streamlit = true
} else {
  console.log('  apps/streamlit: no changeset bump, skipping')
}

writeFileSync(
  path.join(repoRoot, 'prerelease-targets.json'),
  JSON.stringify(targets, null, 2) + '\n',
)
console.log(`Targets: ${JSON.stringify(targets)}`)
