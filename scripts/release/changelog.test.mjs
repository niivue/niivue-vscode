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
import { bumpMarker, formatEntry, pullRequestFor } from './changelog.mjs'
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

console.log('pullRequestFor')

// main: m0 - c (feature branch) merged as m1, then m2 merges another branch.
const merge = (hash, parents, subject) => ({ hash, parents, subject })
const afterBranchCommit = [
  merge('b2', ['c', 'm0'], 'Merge main into claude/feature'),
  merge('m1', ['m0', 'b2'], 'Merge pull request #335 from niivue/claude/feature'),
  merge('m2', ['m1', 'x'], 'Merge pull request #336 from niivue/claude/other'),
]

test('a squash merge on main gives the number in its subject', () => {
  const later = [merge('m2', ['c', 'x'], 'Merge pull request #336 from niivue/claude/other')]
  assert.equal(pullRequestFor('c', 'fix: colormap list (#300)', later), '300')
  assert.equal(pullRequestFor('c', 'fix: colormap list (#300)', []), '300')
})

test('a branch commit gets the pull request that merged it, not a later one', () => {
  assert.equal(pullRequestFor('c', 'fix: colormap list', afterBranchCommit), '335')
})

test('an issue number at the end of a branch commit is not taken for the pull request', () => {
  assert.equal(pullRequestFor('c', 'fix: int64 volumes (#90)', afterBranchCommit), '335')
})

test('a pull request that merged main into a feature branch is not the one', () => {
  const update = [
    merge('u', ['f0', 'c'], 'Merge pull request #340 from niivue/main'),
    merge('m2', ['c', 'u'], 'Merge pull request #341 from niivue/feature'),
  ]
  assert.equal(pullRequestFor('c', 'docs: fix typo', update), null)
})

test('a merge into a side branch listed first is not the one', () => {
  const side = [
    merge('s1', ['o0', 'c'], 'Merge pull request #329 from niivue/base'),
    merge('m1', ['m0', 'c'], 'Merge pull request #330 from niivue/base'),
    merge('m2', ['m1', 's1'], 'Merge pull request #334 from niivue/other'),
  ]
  assert.equal(pullRequestFor('c', 'fix: colormap list', side), '330')
})

test('a stacked branch gets the pull request that brought it into main', () => {
  const stacked = [
    merge('s1', ['s0', 'c'], "Merge remote-tracking branch 'origin/claude/base'"),
    merge('m1', ['m0', 's1'], 'Merge pull request #334 from niivue/claude/stacked'),
  ]
  assert.equal(pullRequestFor('c', 'build: pin pnpm', stacked), '334')
})

test('a commit pushed to main directly has no pull request', () => {
  const onMain = [merge('m2', ['c', 'x'], 'Merge pull request #336 from niivue/claude/other')]
  assert.equal(pullRequestFor('c', 'docs: fix typo', onMain), null)
})

console.log('bumpMarker')

const react = [{ name: '@niivue/react' }]
const changeset = (...releases) => ({ releases: releases.map(([name, type]) => ({ name, type })) })

test('carries the bump of the bundled library', () => {
  assert.equal(bumpMarker(changeset(['@niivue/react', 'minor']), react), '<!-- bump:minor -->')
  assert.equal(bumpMarker(changeset(['@niivue/react', 'patch'], ['niivue', 'minor']), react), '<!-- bump:patch -->')
})

test('a breaking library change counts as a feature of the app', () => {
  assert.equal(bumpMarker(changeset(['@niivue/react', 'major']), react), '<!-- bump:minor -->')
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

test('files library entries under the heading of their bump marker', () => {
  assert.equal(
    polishSection('### Patch Changes\n\n- Fix scroll.\n- Add GraphML. <!-- bump:minor -->\n- Fix drop. <!-- bump:patch -->'),
    '### New features\n\n- Add GraphML.\n\n### Fixes and improvements\n\n- Fix scroll.\n- Fix drop.',
  )
})

test('a library entry repeats an app entry only once', () => {
  assert.equal(
    polishSection('### Minor Changes\n\n- Add GraphML.\n\n### Patch Changes\n\n- Add GraphML. <!-- bump:minor -->'),
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
