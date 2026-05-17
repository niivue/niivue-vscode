#!/usr/bin/env node
/**
 * scripts/release/sync-pyproject-versions.mjs
 *
 * Mirror each app's package.json version into its pyproject.toml so the Python
 * build (which reads pyproject.toml) ships the version changesets computed.
 *
 * Invoked from the root `version` script after `changeset version`; the
 * changesets/action commits the resulting diff into the Version Packages PR.
 *
 * Apps whose pyproject.toml uses dynamic versioning are skipped — they derive
 * their version from package.json at build time (jupyter via
 * hatch-nodejs-version). Only setuptools-based apps need the static rewrite.
 *
 * Idempotent: re-running with unchanged versions is a no-op.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const targets = [
  { pkg: 'apps/streamlit/package.json', toml: 'apps/streamlit/pyproject.toml' },
]

let changed = 0
for (const { pkg, toml } of targets) {
  const pkgVersion = JSON.parse(
    readFileSync(path.join(repoRoot, pkg), 'utf8'),
  ).version
  const tomlPath = path.join(repoRoot, toml)
  const before = readFileSync(tomlPath, 'utf8')
  if (!/^version\s*=/m.test(before)) {
    throw new Error(`${toml}: no static \`version =\` line to update`)
  }
  const after = before.replace(/^version\s*=.*/m, `version = "${pkgVersion}"`)
  if (before !== after) {
    writeFileSync(tomlPath, after)
    console.log(`  ${toml}: ${pkgVersion}`)
    changed++
  }
}

if (changed === 0) {
  console.log('pyproject versions already in sync with package.json')
}
