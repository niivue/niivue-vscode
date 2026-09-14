/**
 * scripts/release/changelog.mjs
 *
 * Changesets changelog functions (configured in .changeset/config.json).
 *
 * Every entry is the changeset summary followed by a link to the pull request
 * that added it. Changes to a workspace package an app bundles (for example
 * @niivue/react) are listed in that app's changelog like its own changes,
 * instead of an "Updated dependencies" line. polish-changelogs.mjs removes the
 * copies when a changeset names both the library and the app.
 */

import { execFileSync } from 'node:child_process'

const REPO_URL = 'https://github.com/niivue/niivue-vscode'

// Squash merges end their subject with the pull request number: "feat: ... (#305)".
const pullRequestOf = (commit) => {
  if (!commit) return null
  try {
    const subject = execFileSync('git', ['log', '-1', '--format=%s', commit], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return subject.match(/\(#(\d+)\)\s*$/)?.[1] ?? null
  } catch {
    return null
  }
}

/**
 * Render one changeset as a list entry. The link goes at the end of the first
 * paragraph; further paragraphs are indented so they stay inside the entry.
 */
export const formatEntry = (summary, pullRequest) => {
  const lines = summary.trim().split('\n').map((line) => line.trimEnd())
  const firstBreak = lines.indexOf('')
  const endOfFirstParagraph = (firstBreak === -1 ? lines.length : firstBreak) - 1
  if (pullRequest) {
    lines[endOfFirstParagraph] += ` ([#${pullRequest}](${REPO_URL}/pull/${pullRequest}))`
  }
  return lines.map((line, i) => (i === 0 ? `- ${line}` : line ? `  ${line}` : '')).join('\n')
}

const entryFor = (changeset) => formatEntry(changeset.summary, pullRequestOf(changeset.commit))

export default {
  getReleaseLine: async (changeset) => entryFor(changeset),
  getDependencyReleaseLine: async (changesets) => changesets.map(entryFor).join('\n'),
}
