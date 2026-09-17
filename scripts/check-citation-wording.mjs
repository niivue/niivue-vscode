#!/usr/bin/env node
/**
 * scripts/check-citation-wording.mjs
 *
 * The paper users are asked to cite describes the NiiVue wrapper ecosystem
 * that this repository ships, not the NiiVue core library. Wording that asks
 * to cite NiiVue alone reads as the core, so the viewer, docs and changesets
 * say "Cite NiiVue VS Code". Fails on any tracked text that drops "VS Code".
 *
 *   node scripts/check-citation-wording.mjs
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AMBIGUOUS = /\bcite\s+niivue\b(?!\s+vs\s*code)/i
const TEXT_FILE = /\.(md|mdx|ts|tsx|js|mjs|cjs|css|html|json|py|rs|toml|ya?ml|cff)$/

const files = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter((file) => TEXT_FILE.test(file) && file !== 'pnpm-lock.yaml')

const hits = []
for (const file of files) {
  const abs = path.join(repoRoot, file)
  if (!existsSync(abs)) continue
  readFileSync(abs, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (AMBIGUOUS.test(line)) hits.push(`  ${file}:${i + 1}: ${line.trim()}`)
    })
}

if (hits.length > 0) {
  console.error('Write "Cite NiiVue VS Code": the paper covers the wrapper ecosystem, not the NiiVue core.')
  console.error(hits.join('\n'))
  process.exit(1)
}
console.log(`Citation wording: ${files.length} files checked.`)
