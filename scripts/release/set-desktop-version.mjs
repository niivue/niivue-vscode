#!/usr/bin/env node
/**
 * scripts/release/set-desktop-version.mjs
 *
 * Stamp an explicit version into the Tauri desktop app's manifests before a
 * build. Used by the pre-release lane (.github/workflows/prerelease.yml calls
 * the reusable release_desktop.yml with the beta version computed by
 * encode-prerelease-versions.mjs) so the bundle / installer metadata carries
 * that version. Runs on the desktop build matrix (Linux/macOS/Windows), so it
 * is a plain Node script rather than sed/jq to stay portable.
 *
 * Writes:
 *   - apps/desktop-tauri/package.json              ("version")
 *   - apps/desktop-tauri/src-tauri/tauri.conf.json ("version" — authoritative
 *     for the bundle/installer; overrides Cargo.toml)
 *   - apps/desktop-tauri/src-tauri/Cargo.toml      ([package] version)
 *
 * Usage: node scripts/release/set-desktop-version.mjs <version>
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const version = process.argv[2]
if (!version) {
  console.error('Usage: set-desktop-version.mjs <version>')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const desktop = 'apps/desktop-tauri'

const setJsonVersion = (relPath) => {
  const abs = path.join(repoRoot, relPath)
  const json = JSON.parse(readFileSync(abs, 'utf8'))
  json.version = version
  writeFileSync(abs, JSON.stringify(json, null, 2) + '\n')
  console.log(`  ${relPath}: ${version}`)
}

const setCargoVersion = (relPath) => {
  const abs = path.join(repoRoot, relPath)
  const toml = readFileSync(abs, 'utf8')
  // Replace the first line-anchored `version = "..."` — the [package] version.
  // Dependency versions are inline (`tauri = { version = "2" }`) and not
  // line-anchored, so they are left untouched.
  if (!/^version\s*=\s*".*"/m.test(toml)) {
    throw new Error(`${relPath}: no [package] version line found`)
  }
  writeFileSync(abs, toml.replace(/^version\s*=\s*".*"/m, `version = "${version}"`))
  console.log(`  ${relPath}: ${version}`)
}

console.log(`Stamping desktop version ${version}:`)
setJsonVersion(`${desktop}/package.json`)
setJsonVersion(`${desktop}/src-tauri/tauri.conf.json`)
setCargoVersion(`${desktop}/src-tauri/Cargo.toml`)
