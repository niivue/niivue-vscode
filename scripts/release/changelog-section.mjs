#!/usr/bin/env node
/**
 * scripts/release/changelog-section.mjs
 *
 * Prints the notes of one changelog section, for GitHub release bodies.
 *
 * Usage:
 *   node scripts/release/changelog-section.mjs <CHANGELOG.md> [version]
 *
 * Without a version it prints the top section. Exits 1 if the section is missing.
 */

import { readFileSync } from 'node:fs'
import { sectionBody } from './polish-changelogs.mjs'

const [file, version] = process.argv.slice(2)
if (!file) {
  console.error('Usage: changelog-section.mjs <CHANGELOG.md> [version]')
  process.exit(1)
}

const body = sectionBody(readFileSync(file, 'utf8'), version)
if (body === null) {
  console.error(`${file}: no section ${version ? `"## ${version}"` : 'found'}`)
  process.exit(1)
}
console.log(body)
