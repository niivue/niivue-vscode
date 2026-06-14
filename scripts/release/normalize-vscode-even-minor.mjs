#!/usr/bin/env node
/**
 * scripts/release/normalize-vscode-even-minor.mjs
 *
 * Enforce the VS Code Marketplace version convention on the STABLE lane:
 * stable releases live on an EVEN minor, pre-releases on an ODD minor
 * (Microsoft's recommended pattern). Changesets does plain sequential semver
 * bumps and is unaware of the convention, so a `minor` bump can land stable
 * on an odd minor; that is exactly how `niivue@2.9.0` shipped.
 *
 * An odd-minor stable sits in the lane reserved for pre-releases, which is a
 * latent collision: the next stable minor bump (e.g. 2.10.0 → 2.11.0) would
 * land on a minor that pre-releases have already published as `2.11.<run>`.
 * The Marketplace keeps a single strictly-increasing version line shared by
 * the stable and pre-release channels (the very reason the even/odd split
 * exists), so a stable `2.11.0` published below an existing `2.11.<run>`
 * pre-release would be rejected, or buried beneath it.
 *
 * This script runs from the root `version` script, immediately after
 * `changeset version`. If changesets bumped `apps/vscode` (the `niivue`
 * package) onto an odd minor, it rounds up to the next even minor (patch
 * reset to 0) and retitles the matching CHANGELOG.md heading so the changelog
 * and package.json agree. changesets/action then commits the result into the
 * "Version Packages" PR, so the even minor is what reviewers see and ship.
 *
 * Counterpart: scripts/release/encode-prerelease-versions.mjs derives the
 * pre-release minor as (next-stable minor + 1, rounded up to odd). Because
 * both sides reduce the same changesets next-stable (this one to the next
 * even, the encoder to the next odd above), the pre-release minor is always
 * exactly one above the (normalized) stable minor, so the two channels never
 * collide.
 *
 * Only the VS Code extension is affected. PyPI (jupyter/streamlit) and the
 * Tauri desktop bundles have no even/odd convention; their pre-release
 * encodings (`.devN`, plain numeric) already keep the channels distinct.
 *
 * Idempotent: a version already on an even minor is left untouched, so this
 * is a no-op on the common path (a `minor` bump that already lands even, or
 * any `patch` bump, which never changes the minor).
 *
 * Usage (normally invoked via `pnpm run version`):
 *   node scripts/release/normalize-vscode-even-minor.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Round a bare `M.m.p` version up to the next even minor when its minor is
 * odd; even-minor versions are returned unchanged. Patch resets to 0 on a
 * bump because the patch counter from the odd (pre-release) lane carries no
 * meaning on the new even minor.
 *
 *   2.9.0 → 2.10.0     2.10.0 → 2.10.0 (no-op)
 *   2.9.3 → 2.10.0     2.10.4 → 2.10.4 (no-op)
 *   3.1.0 → 3.2.0      3.0.0  → 3.0.0  (0 is even)
 */
const toEvenMinor = (version) => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(
      `normalize-vscode-even-minor: expected a bare M.m.p stable version, got "${version}"`,
    )
  }
  const [major, minor] = version.split('.').map(Number)
  if (minor % 2 === 0) return version
  return `${major}.${minor + 1}.0`
}

// Escape a version string for use as a RegExp literal (the dots, mainly).
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Same main-vs-import guard idiom as scripts/coverage/aggregate.mjs: run the
// file-mutating work only when invoked directly, so the unit test can import
// `toEvenMinor` without side effects.
const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (invokedDirectly) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(__dirname, '../..')
  const pkgPath = path.join(repoRoot, 'apps/vscode/package.json')
  const changelogPath = path.join(repoRoot, 'apps/vscode/CHANGELOG.md')

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const current = pkg.version
  const normalized = toEvenMinor(current)

  if (normalized === current) {
    console.log(
      `apps/vscode: ${current} already on an even minor; no normalization needed`,
    )
  } else {
    pkg.version = normalized
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

    // Keep the freshly-prepended CHANGELOG heading in step with the bumped
    // version. `changeset version` writes the same version to both files, so
    // the heading to retitle is `## <current>` (exact, and unique; it was
    // just created). If it is absent (e.g. a changelog-less run), the
    // package.json bump still stands; warn rather than fail.
    const md = readFileSync(changelogPath, 'utf8')
    const headingRe = new RegExp(`^## ${escapeRegExp(current)}$`, 'm')
    if (headingRe.test(md)) {
      writeFileSync(changelogPath, md.replace(headingRe, `## ${normalized}`))
    } else {
      console.warn(
        `  apps/vscode/CHANGELOG.md: no "## ${current}" heading found to retitle; package.json updated regardless`,
      )
    }

    console.log(
      `apps/vscode: normalized ${current} → ${normalized} (even-minor Marketplace convention)`,
    )
  }
}

export { toEvenMinor }
