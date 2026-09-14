#!/usr/bin/env node
/**
 * scripts/release/changelog.test.mjs
 *
 * Unit tests for the changelog entry format and the changelog polish step.
 * Same node:assert shim as normalize-vscode-even-minor.test.mjs.
 *
 *   node scripts/release/changelog.test.mjs
 */
import assert from 'node:assert/strict'
import { formatEntry } from './changelog.mjs'
import { polishChangelog, polishSection, sectionBody } from './polish-changelogs.mjs'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.log(`  ✗ ${name}`)
    console.log(`    ${err.message}`)
    failed++
  }
}

const PR_300 = '([#300](https://github.com/niivue/niivue-vscode/pull/300))'

console.log('formatEntry')

test('a one-line summary becomes an entry ending in its pull request link', () => {
  assert.equal(formatEntry('Save the viewer tiles as a PNG figure.\n', 300), `- Save the viewer tiles as a PNG figure. ${PR_300}`)
})

test('the link closes the first paragraph of a wrapped summary', () => {
  assert.equal(
    formatEntry('Save the viewer tiles\nas a PNG figure.\n\nUse the Screenshot button.', 300),
    `- Save the viewer tiles\n  as a PNG figure. ${PR_300}\n\n  Use the Screenshot button.`,
  )
})

test('without a pull request the entry has no link', () => {
  assert.equal(formatEntry('Fix the colorbar.', null), '- Fix the colorbar.')
})

console.log('polishSection')

test('renames the Changesets headings', () => {
  assert.equal(
    polishSection('### Major Changes\n\n- a\n\n### Minor Changes\n\n- b\n\n### Patch Changes\n\n- c'),
    '### Breaking changes\n\n- a\n\n### New features\n\n- b\n\n### Fixes and improvements\n\n- c',
  )
})

test('keeps a repeated entry only under its first heading and drops the empty heading', () => {
  assert.equal(
    polishSection('### Minor Changes\n\n- Add GraphML.\n\n### Patch Changes\n\n- Add GraphML.'),
    '### New features\n\n- Add GraphML.',
  )
})

test('keeps continuation lines with their entry', () => {
  assert.equal(
    polishSection('### Patch Changes\n\n- First\n  more\n\n  second paragraph\n- Other'),
    '### Fixes and improvements\n\n- First\n  more\n\n  second paragraph\n- Other',
  )
})

test('entries that only share a first line are both kept', () => {
  assert.equal(
    polishSection('### Patch Changes\n\n- Fix\n  in VS Code\n- Fix\n  in JupyterLab'),
    '### Fixes and improvements\n\n- Fix\n  in VS Code\n- Fix\n  in JupyterLab',
  )
})

console.log('polishChangelog and sectionBody')

const changelog = [
  '# niivue',
  '',
  '## 2.10.0',
  '',
  '### Minor Changes',
  '',
  '- New',
  '',
  '### Patch Changes',
  '',
  '- New',
  '',
  '## 2.9.0',
  '',
  '### Minor Changes',
  '',
  '- Old',
  '',
].join('\n')

test('only the top section is polished', () => {
  assert.equal(
    polishChangelog(changelog),
    ['# niivue', '', '## 2.10.0', '', '### New features', '', '- New', '', '## 2.9.0', '', '### Minor Changes', '', '- Old', ''].join('\n'),
  )
})

test('polishing twice changes nothing', () => {
  assert.equal(polishChangelog(polishChangelog(changelog)), polishChangelog(changelog))
})

test('sectionBody returns the notes of the top section or of a version', () => {
  assert.equal(sectionBody(changelog), '### Minor Changes\n\n- New\n\n### Patch Changes\n\n- New')
  assert.equal(sectionBody(changelog, '2.9.0'), '### Minor Changes\n\n- Old')
  assert.equal(sectionBody(changelog, '1.0.0'), null)
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
