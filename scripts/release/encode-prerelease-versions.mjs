#!/usr/bin/env node
/**
 * scripts/release/encode-prerelease-versions.mjs
 *
 * Reads the changeset release plan (`changeset-status.json`, produced by
 * `pnpm changeset status --output=...` in the prerelease workflow) and, for
 * each published app whose package was bumped, rewrites package.json (and
 * pyproject.toml where relevant) with the per-target pre-release version
 * derived from the plan's `newVersion`.
 *
 * Packages NOT in the release plan are skipped — re-encoding their current
 * version would produce a release that ranks ambiguously (e.g. PyPI dev
 * releases sort below the matching stable, so pip --pre would happily
 * "downgrade" a user back to the dev cycle of an already-shipped stable).
 *
 * Conventions:
 *   - VS Code Marketplace requires bare `M.m.p`. Pre-releases live on an
 *     odd minor strictly greater than the next-stable's minor:
 *       next-stable 2.10.0 → pre 2.11.<run>
 *       next-stable 2.9.0  → pre 2.11.<run>   (skip same-minor collision)
 *     The stable lane normalizes its own version to an EVEN minor (see
 *     scripts/release/normalize-vscode-even-minor.mjs), so the pre-release
 *     minor computed here is always exactly one above the stable minor and
 *     the two channels never collide. Keep the two parity rules in step.
 *   - PyPI requires PEP 440. We use `.devN` (development release) so plain
 *     `pip install <pkg>` ignores it; only `pip install --pre` picks it up.
 *     Next-stable 0.3.1 → 0.3.1.dev<run>.
 *   - package.json holds a semver-compatible mirror (`<base>-dev.<run>`) so
 *     pnpm/turbo/changesets keep parsing the manifest. The authoritative
 *     PyPI version is written to pyproject.toml.
 *   - Desktop (Tauri): plain numeric `<major>.<minor>.<run>`. Windows MSI and
 *     macOS bundlers reject SemVer pre-release identifiers, so we mirror the
 *     VS Code style (bare numeric, run number as the distinguishing part).
 *
 * Outputs:
 *   prerelease-targets.json — { vscode, jupyter, streamlit, desktop } booleans
 *     plus desktopVersion (string), used by the workflow to gate per-target
 *     publish steps. The desktop bundle is built in a separate workflow
 *     (release_desktop.yml via workflow_call) with its own checkout, so its
 *     version is only COMPUTED here and passed through — this script does not
 *     rewrite the desktop manifests (that workflow stamps them itself via
 *     set-desktop-version.mjs).
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

const planPath = path.join(repoRoot, 'changeset-status.json')
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
if (!Array.isArray(plan.releases)) {
  throw new Error(
    `${planPath}: expected \`releases\` array (changesets ReleasePlan); got ${typeof plan.releases}`,
  )
}
const releases = new Map(plan.releases.map((r) => [r.name, r]))

const writePkgVersion = (relPath, newVersion) => {
  const abs = path.join(repoRoot, relPath)
  const pkg = JSON.parse(readFileSync(abs, 'utf8'))
  pkg.version = newVersion
  writeFileSync(abs, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  ${relPath}: ${newVersion}`)
}

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

// Desktop (Tauri) bundles use a plain numeric M.m.p version (see header):
// keep the next-stable major.minor and use the run number as the patch.
const toDesktopPreRelease = (nextStable) => {
  const [major, minor] = nextStable.split('.').map(Number)
  return `${major}.${minor}.${runNumber}`
}

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
if (releases.size === 0) {
  console.log('  release plan is empty; nothing to encode')
}

const nextStable = (pkgName) => releases.get(pkgName)?.newVersion

const targets = {
  vscode: false,
  jupyter: false,
  streamlit: false,
  desktop: false,
  desktopVersion: '',
}

// ── VS Code extension ───────────────────────────────────────────────────────
const vscodeNext = nextStable('niivue')
if (vscodeNext) {
  writePkgVersion('apps/vscode/package.json', toVscodePreRelease(vscodeNext))
  targets.vscode = true
} else {
  console.log('  apps/vscode: not in release plan, skipping')
}

// ── JupyterLab extension ────────────────────────────────────────────────────
const jupyterNext = nextStable('@niivue/jupyter')
if (jupyterNext) {
  writePkgVersion('apps/jupyter/package.json', toSemverDev(jupyterNext))
  overridePyprojectVersion('apps/jupyter/pyproject.toml', toPep440Dev(jupyterNext))
  targets.jupyter = true
} else {
  console.log('  apps/jupyter: not in release plan, skipping')
}

// ── Streamlit component ─────────────────────────────────────────────────────
const streamlitNext = nextStable('@niivue/streamlit')
if (streamlitNext) {
  writePkgVersion('apps/streamlit/package.json', toSemverDev(streamlitNext))
  overridePyprojectVersion(
    'apps/streamlit/pyproject.toml',
    toPep440Dev(streamlitNext),
  )
  targets.streamlit = true
} else {
  console.log('  apps/streamlit: not in release plan, skipping')
}

// ── Desktop (Tauri) ───────────────────────────────────────────────────────
// Built in a separate workflow (release_desktop.yml, called from
// prerelease.yml) with its own checkout, so we only COMPUTE the version here
// and pass it through prerelease-targets.json; that workflow stamps the
// manifests via set-desktop-version.mjs before building.
const desktopNext = nextStable('@niivue/tauri')
if (desktopNext) {
  targets.desktop = true
  targets.desktopVersion = toDesktopPreRelease(desktopNext)
  console.log(`  apps/desktop-tauri: ${targets.desktopVersion} (built in release_desktop.yml)`)
} else {
  console.log('  apps/desktop-tauri: not in release plan, skipping')
}

writeFileSync(
  path.join(repoRoot, 'prerelease-targets.json'),
  JSON.stringify(targets, null, 2) + '\n',
)
console.log(`Targets: ${JSON.stringify(targets)}`)
