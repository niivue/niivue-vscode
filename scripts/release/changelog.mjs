/**
 * scripts/release/changelog.mjs
 *
 * Changesets changelog functions (configured in .changeset/config.json).
 *
 * Every entry is the changeset summary followed by a link to the pull request
 * that added it. Changes to a workspace package an app bundles (for example
 * @niivue/react) are listed in that app's changelog like its own changes,
 * instead of an "Updated dependencies" line. polish-changelogs.mjs files them
 * under the right heading and removes the copy when a changeset names both the
 * library and the app.
 */

import { execFileSync } from 'node:child_process'

const REPO_URL = 'https://github.com/niivue/niivue-vscode'

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })

/**
 * The pull request of a commit that came into HEAD through a merge is the one named
 * by that merge on HEAD's first-parent chain ("Merge pull request #N from ...").
 * A commit on that chain itself is a squash merge, whose subject ends with the
 * number ("feat: ... (#305)"), or a direct push. `descendants` are the commits
 * between it and HEAD, oldest first and ending at HEAD, as `{ hash, parents, subject }`.
 */
export const pullRequestFor = (commit, subject, descendants) => {
  const byHash = new Map(descendants.map((c) => [c.hash, c]))
  let entry = descendants.at(-1)
  while (entry && byHash.has(entry.parents[0])) entry = byHash.get(entry.parents[0])
  if (entry && entry.parents[0] !== commit) {
    return entry.subject.match(/^Merge pull request #(\d+) /)?.[1] ?? null
  }
  return subject.match(/\(#(\d+)\)\s*$/)?.[1] ?? null
}

const pullRequestOf = (commit) => {
  if (!commit) return null
  try {
    const hash = git('rev-parse', commit).trim()
    const subject = git('log', '-1', '--format=%s', hash)
    const log = git('log', '--ancestry-path', '--topo-order', '--reverse', '--format=%H%x09%P%x09%s', `${hash}..HEAD`)
    const descendants = log
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [h, parents, ...rest] = line.split('\t')
        return { hash: h, parents: parents.split(' '), subject: rest.join('\t') }
      })
    return pullRequestFor(hash, subject, descendants)
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

const BUMPS = ['patch', 'minor', 'major']

/**
 * Changesets lists every dependency entry under Patch Changes. The marker
 * carries the changeset's bump of the library, so polish-changelogs.mjs can
 * file the entry as a feature or a fix. A library's breaking change is not
 * breaking for users of the app, so it counts as a feature.
 */
export const bumpMarker = (changeset, dependencies) => {
  const names = new Set(dependencies.map((dependency) => dependency.name))
  const level = Math.max(
    0,
    ...changeset.releases.filter((release) => names.has(release.name)).map((release) => BUMPS.indexOf(release.type)),
  )
  return `<!-- bump:${BUMPS[Math.min(level, 1)]} -->`
}

export default {
  getReleaseLine: async (changeset) => entryFor(changeset),
  getDependencyReleaseLine: async (changesets, dependencies) =>
    changesets.map((changeset) => `${entryFor(changeset)} ${bumpMarker(changeset, dependencies)}`).join('\n'),
}
