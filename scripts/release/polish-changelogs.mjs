#!/usr/bin/env node
/**
 * scripts/release/polish-changelogs.mjs
 *
 * Tidies the sections `changeset version` just added to CHANGELOG.md files:
 *   - headings users understand: "Breaking changes", "New features",
 *     "Fixes and improvements" instead of Major/Minor/Patch Changes
 *   - an entry listed twice (a changeset naming both a bundled library and the
 *     app) is kept only under its first heading
 *   - headings left without entries are dropped
 *
 * Only a top section that is not in HEAD's copy of the file is touched, so
 * packages without a new release keep their changelog as it is.
 *
 * Usage (from the root `version` script, after `changeset version`):
 *   node scripts/release/polish-changelogs.mjs
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HEADINGS = {
  'Major Changes': 'Breaking changes',
  'Minor Changes': 'New features',
  'Patch Changes': 'Fixes and improvements',
}

/**
 * Locate a `## <version>` section: the first one, or the one for `version`.
 * Returns the line range of its body (after the heading), or null.
 */
export const findSection = (markdown, version) => {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) =>
    version === undefined ? line.startsWith('## ') : line.trim() === `## ${version}`,
  )
  if (start === -1) return null
  let end = lines.findIndex((line, i) => i > start && line.startsWith('## '))
  if (end === -1) end = lines.length
  return { lines, start, end, heading: lines[start].slice(3).trim() }
}

/** The body of a section, without its heading, or null if there is none. */
export const sectionBody = (markdown, version) => {
  const section = findSection(markdown, version)
  if (!section) return null
  return section.lines.slice(section.start + 1, section.end).join('\n').trim()
}

/** Rename headings, drop repeated entries and empty headings in a section body. */
export const polishSection = (body) => {
  const groups = []
  let group = null
  let entry = null
  const closeEntry = () => {
    if (entry) group.entries.push(entry.join('\n').trimEnd())
    entry = null
  }
  for (const line of body.split('\n')) {
    const heading = line.match(/^### (.+)$/)
    if (heading) {
      closeEntry()
      group = { title: HEADINGS[heading[1].trim()] ?? heading[1].trim(), entries: [] }
      groups.push(group)
    } else if (line.startsWith('- ')) {
      closeEntry()
      if (!group) {
        group = { title: null, entries: [] }
        groups.push(group)
      }
      entry = [line]
    } else if (entry) {
      entry.push(line)
    }
  }
  closeEntry()

  const seen = new Set()
  return groups
    .map((g) => ({ ...g, entries: g.entries.filter((e) => !seen.has(e) && seen.add(e)) }))
    .filter((g) => g.entries.length > 0)
    .map((g) => (g.title ? `### ${g.title}\n\n` : '') + g.entries.join('\n'))
    .join('\n\n')
}

/** Polish the top section of a changelog; other sections are left untouched. */
export const polishChangelog = (markdown) => {
  const section = findSection(markdown)
  if (!section) return markdown
  const { lines, start, end } = section
  const body = polishSection(lines.slice(start + 1, end).join('\n'))
  const rest = lines.slice(end).join('\n')
  return [...lines.slice(0, start + 1), '', body, ...(rest ? ['', rest] : [''])].join('\n')
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (invokedDirectly) {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const repoRoot = git('rev-parse', '--show-toplevel').trim()
  const files = git('ls-files', '--cached', '--others', '--exclude-standard', '--', '*CHANGELOG.md')
    .split('\n')
    .filter((file) => file && !file.includes('node_modules/'))

  for (const file of files) {
    const abs = path.join(repoRoot, file)
    if (!existsSync(abs)) continue
    const markdown = readFileSync(abs, 'utf8')
    let committed = ''
    try {
      committed = git('show', `HEAD:${file}`)
    } catch {
      // A changelog created by this version run.
    }
    const top = findSection(markdown)
    if (!top || findSection(committed)?.heading === top.heading) continue
    const polished = polishChangelog(markdown)
    if (polished !== markdown) {
      writeFileSync(abs, polished)
      console.log(`  ${file}: polished ## ${top.heading}`)
    }
  }
}
