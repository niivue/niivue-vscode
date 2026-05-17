#!/usr/bin/env node
/**
 * scripts/release/encode-prerelease-versions.mjs
 *
 * Post-processor for `pnpm changeset version --snapshot beta`. Reads the
 * just-bumped per-app versions, strips changeset's "-beta-<id>" suffix, and
 * re-encodes each one for its target's version format using the CI run
 * number as the unique build identifier.
 *
 * Conventions:
 *   - VS Code Marketplace requires bare `M.m.p`. Pre-releases live on an
 *     odd minor strictly greater than the latest stable minor. If changesets
 *     plans next-stable `2.10.0`, the pre-release becomes `2.11.<run>`.
 *   - PyPI requires PEP 440. We use `.devN` (development release) so plain
 *     `pip install <pkg>` ignores it; only `pip install --pre` picks it up.
 *     Next-stable `0.3.0` becomes `0.3.0.dev<run>`.
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

const readPkg = (relPath) =>
  JSON.parse(readFileSync(path.join(repoRoot, relPath), 'utf8'))

const writePkgVersion = (relPath, newVersion) => {
  const abs = path.join(repoRoot, relPath)
  const pkg = JSON.parse(readFileSync(abs, 'utf8'))
  pkg.version = newVersion
  writeFileSync(abs, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  ${relPath}: ${newVersion}`)
}

// Strip changeset's snapshot suffix to recover the base "next-stable" version.
//   "0.3.0-beta-20260517abc" → "0.3.0"
//   "2.10.0-beta-abc" → "2.10.0"
const stripSnapshot = (version) => version.replace(/-beta-.*$/, '')

// VS Code: bump to next odd minor (or stay if already odd), patch = run.
const toVscodePreRelease = (nextStable) => {
  const [major, minor] = nextStable.split('.').map(Number)
  const preMinor = minor % 2 === 0 ? minor + 1 : minor
  return `${major}.${preMinor}.${runNumber}`
}

// PEP 440 development release: "<base>.dev<run>".
const toPep440Dev = (nextStable) => `${nextStable}.dev${runNumber}`

console.log(`Encoding pre-release versions (run #${runNumber}):`)

// ── VS Code extension ───────────────────────────────────────────────────────
{
  const nextStable = stripSnapshot(readPkg('apps/vscode/package.json').version)
  writePkgVersion('apps/vscode/package.json', toVscodePreRelease(nextStable))
}

// ── JupyterLab extension ────────────────────────────────────────────────────
// hatch-nodejs-version reads package.json and converts to PEP 440 for the
// Python wheel, so writing the dev version into package.json is enough.
{
  const nextStable = stripSnapshot(readPkg('apps/jupyter/package.json').version)
  writePkgVersion('apps/jupyter/package.json', toPep440Dev(nextStable))
}

// ── Streamlit component ─────────────────────────────────────────────────────
// Version lives in pyproject.toml (hardcoded). Use package.json as the source
// of truth (changesets bumped it) and rewrite pyproject.toml accordingly.
{
  const nextStable = stripSnapshot(readPkg('apps/streamlit/package.json').version)
  const devVersion = toPep440Dev(nextStable)
  writePkgVersion('apps/streamlit/package.json', devVersion)

  const pyprojectPath = path.join(repoRoot, 'apps/streamlit/pyproject.toml')
  const updated = readFileSync(pyprojectPath, 'utf8').replace(
    /^version = .*/m,
    `version = "${devVersion}"`,
  )
  writeFileSync(pyprojectPath, updated)
  console.log(`  apps/streamlit/pyproject.toml: ${devVersion}`)
}

console.log('Done.')
