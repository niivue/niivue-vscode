#!/usr/bin/env node
/**
 * scripts/coverage/aggregate.mjs
 *
 * Aggregates per-package coverage reports into a single merged report and
 * produces a monorepo-aware summary table.
 *
 * Usage:
 *   node scripts/coverage/aggregate.mjs
 *
 * Outputs:
 *   coverage/merged/index.html   — combined source-mapped HTML report
 *   coverage/summary.json        — machine-readable per-row numbers
 *   coverage/summary.md          — Markdown table for the README
 */

import { createRequire } from 'module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { glob } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const require = createRequire(import.meta.url)

// ---------------------------------------------------------------------------
// 1. Locate all coverage-final.json / coverage-summary.json files
// ---------------------------------------------------------------------------

/**
 * Recursively find files matching a pattern relative to the repo root.
 * Falls back to a manual walk if the Node.js `glob` built-in is not
 * available (Node < 22).
 */
async function findCoverageFiles() {
  const patterns = [
    '**/coverage/**/*.json',
  ]
  const found = new Set()

  // Try Node 22+ built-in glob
  for (const pattern of patterns) {
    try {
      for await (const file of glob(pattern, { cwd: repoRoot })) {
        if (file.includes('coverage-final.json') || file.includes('coverage-summary.json')) {
          found.add(path.resolve(repoRoot, file))
        }
      }
    } catch {
      // Fall back to manual walk (see below)
    }
  }

  // Manual recursive walk fallback
  if (found.size === 0) {
    const { readdirSync, statSync } = await import('fs')
    function walk(dir) {
      if (!existsSync(dir)) return
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        // Skip node_modules and .git
        if (entry === 'node_modules' || entry === '.git') continue
        const st = statSync(full)
        if (st.isDirectory()) {
          walk(full)
        } else if (
          (entry === 'coverage-final.json' || entry === 'coverage-summary.json') &&
          full.includes(`${path.sep}coverage${path.sep}`)
        ) {
          found.add(full)
        }
      }
    }
    walk(repoRoot)
  }

  return [...found]
}

// ---------------------------------------------------------------------------
// 2. Bucket definitions — map file paths → summary rows
// ---------------------------------------------------------------------------

const BUCKETS = [
  {
    id: 'shared-core',
    label: 'Shared core (`packages/niivue-react`)',
    match: (f) => f.includes('packages/niivue-react/src'),
  },
  {
    id: 'pwa-glue',
    label: '`apps/pwa`',
    match: (f) => f.includes('apps/pwa/src'),
  },
  {
    id: 'jupyter-glue',
    label: '`apps/jupyter`',
    match: (f) => f.includes('apps/jupyter/src'),
  },
  {
    id: 'streamlit-glue',
    label: '`apps/streamlit`',
    match: (f) =>
      f.includes('apps/streamlit/niivue_component/frontend/src') ||
      f.includes('apps/streamlit/niivue_component/'),
  },
  {
    id: 'vscode-glue',
    label: '`apps/vscode`',
    match: (f) => f.includes('apps/vscode/src'),
  },
]

// ---------------------------------------------------------------------------
// 3. Merge Istanbul coverage-final.json files
// ---------------------------------------------------------------------------

function mergeCoverageFinal(files) {
  const merged = {}
  for (const file of files) {
    if (!existsSync(file)) continue
    let data
    try {
      data = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      console.warn(`Warning: could not parse ${file}`)
      continue
    }
    for (const [key, value] of Object.entries(data)) {
      if (!merged[key]) {
        merged[key] = value
      } else {
        // Merge statement/branch/function/line counts
        for (const [sid, count] of Object.entries(value.s)) {
          merged[key].s[sid] = (merged[key].s[sid] ?? 0) + count
        }
        for (const [bid, counts] of Object.entries(value.b)) {
          if (!merged[key].b[bid]) {
            merged[key].b[bid] = counts
          } else {
            merged[key].b[bid] = merged[key].b[bid].map((c, i) => c + (counts[i] ?? 0))
          }
        }
        for (const [fid, count] of Object.entries(value.f)) {
          merged[key].f[fid] = (merged[key].f[fid] ?? 0) + count
        }
      }
    }
  }
  return merged
}

// ---------------------------------------------------------------------------
// 4. Compute per-bucket percentages from merged Istanbul data
// ---------------------------------------------------------------------------

function pctOf(n) {
  return n.total === 0 ? null : Math.round((n.covered / n.total) * 1000) / 10
}

function computeStats(istanbulData) {
  const totals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  }

  for (const [, fileCov] of Object.entries(istanbulData)) {
    // Statements
    for (const count of Object.values(fileCov.s)) {
      totals.statements.total++
      if (count > 0) totals.statements.covered++
    }
    // Branches
    for (const counts of Object.values(fileCov.b)) {
      for (const count of counts) {
        totals.branches.total++
        if (count > 0) totals.branches.covered++
      }
    }
    // Functions
    for (const count of Object.values(fileCov.f)) {
      totals.functions.total++
      if (count > 0) totals.functions.covered++
    }
    // Lines (unique line numbers that have statements)
    const coveredLines = new Set()
    const totalLines = new Set()
    for (const [sid, count] of Object.entries(fileCov.s)) {
      const loc = fileCov.statementMap?.[sid]
      if (loc) {
        const lineKey = loc.start.line
        totalLines.add(lineKey)
        if (count > 0) coveredLines.add(lineKey)
      }
    }
    totals.lines.total += totalLines.size
    totals.lines.covered += coveredLines.size
  }

  return {
    // Percentages: the existing shape, kept for backward compatibility
    // with consumers that only read `.stats.lines` etc.
    stats: {
      statements: pctOf(totals.statements),
      branches: pctOf(totals.branches),
      functions: pctOf(totals.functions),
      lines: pctOf(totals.lines),
    },
    // Raw covered/total counts per metric. Persisted in summary.json so that
    // a partial coverage run (only some apps' tests ran) can synthesise a
    // honest overall by folding in baseline counts for the buckets this run
    // didn't measure — see `synthesiseOverall` below. Without raw counts,
    // the only thing we could compare is "this-run-mean" vs "baseline-mean",
    // which mixes different denominators and produces large fake deltas.
    counts: totals,
  }
}

function bucketData(istanbulData) {
  const result = {}
  for (const bucket of BUCKETS) {
    const subset = {}
    for (const [key, value] of Object.entries(istanbulData)) {
      if (bucket.match(key)) subset[key] = value
    }
    const { stats, counts } = computeStats(subset)
    result[bucket.id] = { label: bucket.label, stats, counts }
  }
  const { stats, counts } = computeStats(istanbulData)
  result._overall = { label: 'Overall', stats, counts }
  return result
}

/**
 * Construct a fair overall for the current run by folding in baseline counts
 * for any bucket this run did not measure. Without this, a PR that only ran
 * one app's tests would emit an "overall" computed from that single app —
 * misleadingly compared against main's whole-codebase overall (e.g. the
 * desktop-only +50% delta that prompted this fix).
 *
 * Returns `{ stats, counts, partial }` where `partial` is true iff at least
 * one bucket's counts came from the baseline rather than this run. Returns
 * `null` if the baseline lacks per-bucket counts (old schema) — in that case
 * the caller should suppress the delta.
 */
function synthesiseOverall(summary, baseline) {
  if (!baseline) return null
  // Detect old-schema baseline (percentages only, no counts): we can't
  // synthesise without raw counts, so the caller falls back to the partial
  // run's own overall (and suppresses the delta).
  const baselineHasCounts = BUCKETS.some((b) => baseline[b.id]?.counts)
  if (!baselineHasCounts) return null

  const totals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  }
  let partial = false

  for (const bucket of BUCKETS) {
    const here = summary[bucket.id]?.counts
    const ranThisTime = here && here.lines.total > 0
    // Mark partial whenever this run skipped a bucket, regardless of whether
    // the baseline could fill in for it. Without this, "summary measured one
    // bucket, baseline also only knows about that one bucket" would emit a
    // single-bucket overall *without* the partial disclosure — the exact
    // misleading-overall problem this function exists to prevent.
    if (!ranThisTime) partial = true
    const source = ranThisTime ? here : baseline[bucket.id]?.counts
    if (!source) continue
    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      totals[metric].covered += source[metric]?.covered ?? 0
      totals[metric].total += source[metric]?.total ?? 0
    }
  }

  return {
    stats: {
      statements: pctOf(totals.statements),
      branches: pctOf(totals.branches),
      functions: pctOf(totals.functions),
      lines: pctOf(totals.lines),
    },
    counts: totals,
    partial,
  }
}

// ---------------------------------------------------------------------------
// 5. Render outputs
// ---------------------------------------------------------------------------

function pctStr(v) {
  if (v === null) return 'N/A'
  return `${v}%`
}

function deltaStr(curr, prev) {
  if (curr === null || prev === null || prev === undefined) return ''
  const diff = Math.round((curr - prev) * 10) / 10
  if (diff === 0) return ''
  const sign = diff > 0 ? '+' : '−'
  return ` (${sign}${Math.abs(diff)})`
}

// Shields color thresholds for line coverage.
function badgeColor(pct) {
  if (pct === null) return 'lightgrey'
  if (pct >= 90) return 'brightgreen'
  if (pct >= 80) return 'green'
  if (pct >= 70) return 'yellowgreen'
  if (pct >= 60) return 'yellow'
  if (pct >= 50) return 'orange'
  return 'red'
}

function buildBadgeJson(summary, baseline = null) {
  // Prefer the synthesised whole-codebase overall so the badge tracks
  // codebase-wide coverage even on PRs that only ran one app's tests.
  // Falls back to this run's bare overall when no baseline counts exist.
  const synth = synthesiseOverall(summary, baseline)
  const overall = synth ? synth.stats.lines : summary._overall?.stats?.lines
  return {
    schemaVersion: 1,
    label: 'coverage',
    message: overall === null || overall === undefined ? 'unknown' : `${overall}%`,
    color: badgeColor(overall ?? null),
  }
}

// Render a single cell. When the current run produced no value for this
// metric but the baseline (last main run) has one, carry the baseline value
// forward with a "*" marker so readers can tell the row was skipped, not
// permanently uncovered. Returns { text, stale }.
function renderCell(curr, prev) {
  if (curr !== null && curr !== undefined) {
    return { text: pctStr(curr) + deltaStr(curr, prev), stale: false }
  }
  if (prev !== null && prev !== undefined) {
    return { text: `${prev}%*`, stale: true }
  }
  return { text: 'N/A', stale: false }
}

/**
 * Resolve the line coverage to display as "Overall" and the value to delta
 * against the baseline. Three cases:
 *
 *   1. Full run + new-schema baseline → synthesis is a no-op (every bucket
 *      ran here, so `source` is always `here`). Display this run's overall;
 *      delta against baseline's overall.
 *   2. Partial run + new-schema baseline → synthesis folds in baseline
 *      counts for buckets that didn't run here, producing a "what would
 *      the codebase overall be if only the parts we measured had changed?"
 *      number. Apples-to-apples vs the baseline overall.
 *   3. Partial run + old-schema baseline (no counts) → no honest comparison
 *      possible. Display this run's overall, suppress the delta with a note.
 */
function resolveOverall(summary, baseline) {
  const thisRun = summary._overall?.stats?.lines ?? null
  const baseOverall = baseline?._overall?.stats?.lines ?? null
  const synth = synthesiseOverall(summary, baseline)

  if (synth) {
    return {
      display: synth.stats.lines,
      deltaAgainst: baseOverall,
      partial: synth.partial,
      synthesised: synth.partial, // partial run that we patched up
      deltaSuppressed: false,
    }
  }
  // No new-schema baseline. If the current run is partial (any bucket
  // missing), we can't honestly compare against main's full overall.
  const isPartial = BUCKETS.some((b) => {
    const c = summary[b.id]?.counts
    return !c || c.lines.total === 0
  })
  return {
    display: thisRun,
    deltaAgainst: baseOverall,
    partial: isPartial,
    synthesised: false,
    deltaSuppressed: isPartial,
  }
}

function buildMarkdownTable(summary, opts = {}) {
  const { baseline = null, reportUrl = null, badgeUrl = null } = opts

  let anyStale = false
  const rows = BUCKETS.map((b) => {
    const s = summary[b.id]?.stats ?? {}
    const baseStats = baseline?.[b.id]?.stats ?? {}
    const cells = [
      renderCell(s.statements ?? null, baseStats.statements ?? null),
      renderCell(s.branches ?? null, baseStats.branches ?? null),
      renderCell(s.functions ?? null, baseStats.functions ?? null),
      renderCell(s.lines ?? null, baseStats.lines ?? null),
    ]
    if (cells.some((c) => c.stale)) anyStale = true
    return [b.label, ...cells.map((c) => c.text)]
  })

  const header = ['Package', 'Statements', 'Branches', 'Functions', 'Lines']
  const separator = header.map(() => '---')
  const table = [header, separator, ...rows]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n')

  const lines = ['## Coverage Report', '']

  if (badgeUrl) {
    const badgeImg = `![coverage](${badgeUrl})`
    lines.push(badgeImg)
    lines.push('')
  }

  const { display, deltaAgainst, synthesised, deltaSuppressed } = resolveOverall(summary, baseline)
  if (display !== null) {
    const delta = deltaSuppressed ? '' : deltaStr(display, deltaAgainst)
    const suffix = deltaSuppressed
      ? ' _(partial run — delta unavailable until baseline includes per-bucket counts)_'
      : delta
        ? ` ${delta.trim()} vs \`main\``
        : ''
    const note = synthesised
      ? ' _(includes carried-over baseline for unmeasured packages)_'
      : ''
    lines.push(`**Overall line coverage: ${pctStr(display)}${suffix}${note}**`)
    lines.push('')
  }

  lines.push(table)
  lines.push('')

  if (anyStale) {
    lines.push('_\\* value carried over from `main` — this run did not produce coverage for that cell._')
    lines.push('')
  }

  if (reportUrl) {
    lines.push(`📊 [View full report →](${reportUrl})`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Escape user-controlled strings before they go into HTML.
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

/**
 * BUCKETS labels are written as Markdown for the PR sticky comment — e.g.
 * ``Shared core (`packages/niivue-react`)``. For the HTML report we want the
 * backticked spans to render as `<code>` rather than literal backticks.
 * Escape first (so any `<`/`>` in a future label is safe), then promote the
 * surviving backtick pairs to `<code>` tags.
 */
function labelToHtml(label) {
  return escapeHtml(label).replace(/`([^`]+)`/g, '<code>$1</code>')
}

/**
 * Render the per-package summary table — same shape as the markdown table
 * used in PR sticky comments — to embed at the top of the HTML report so
 * visitors landing on the published page see headline numbers before the
 * long per-file Istanbul table.
 */
function buildHtmlSummarySection(summary, baseline) {
  let anyStale = false
  const rows = BUCKETS.map((b) => {
    const s = summary[b.id]?.stats ?? {}
    const baseStats = baseline?.[b.id]?.stats ?? {}
    const cells = [
      renderCell(s.statements ?? null, baseStats.statements ?? null),
      renderCell(s.branches ?? null, baseStats.branches ?? null),
      renderCell(s.functions ?? null, baseStats.functions ?? null),
      renderCell(s.lines ?? null, baseStats.lines ?? null),
    ]
    if (cells.some((c) => c.stale)) anyStale = true
    return `      <tr><td>${labelToHtml(b.label)}</td>${cells
      .map((c) => `<td>${escapeHtml(c.text)}</td>`)
      .join('')}</tr>`
  }).join('\n')

  const { display, deltaAgainst, synthesised, deltaSuppressed } = resolveOverall(summary, baseline)
  let overallLine = ''
  if (display !== null) {
    const delta = deltaSuppressed ? '' : deltaStr(display, deltaAgainst)
    const suffix = deltaSuppressed
      ? ' <span class="delta">(partial run — delta unavailable until baseline includes per-bucket counts)</span>'
      : delta
        ? ` <span class="delta">${escapeHtml(delta.trim())} vs <code>main</code></span>`
        : ''
    const note = synthesised
      ? ' <span class="delta">(includes carried-over baseline for unmeasured packages)</span>'
      : ''
    overallLine = `<p class="overall"><strong>Overall line coverage: ${pctStr(display)}</strong>${suffix}${note}</p>`
  }

  const stalenote = anyStale
    ? '<p class="stale-note"><em>* value carried over from <code>main</code> — this run did not produce coverage for that cell.</em></p>'
    : ''

  return `  <section class="summary">
    <h2>Coverage by package</h2>
    ${overallLine}
    <table class="summary-table">
      <thead>
        <tr><th>Package</th><th>Statements</th><th>Branches</th><th>Functions</th><th>Lines</th></tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    ${stalenote}
  </section>`
}

function buildHtmlReport(mergedData, summary, baseline) {
  const fileRows = Object.entries(mergedData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, cov]) => {
      const stmtTotal = Object.keys(cov.s).length
      const stmtCovered = Object.values(cov.s).filter((c) => c > 0).length
      const pct = stmtTotal === 0 ? 'N/A' : `${Math.round((stmtCovered / stmtTotal) * 100)}%`
      const relPath = file.replace(repoRoot, '').replace(/^[\\/]/, '')
      return `<tr><td>${escapeHtml(relPath)}</td><td>${pct} (${stmtCovered}/${stmtTotal})</td></tr>`
    })
    .join('\n')

  const summarySection = summary ? buildHtmlSummarySection(summary, baseline) : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NiiVue Coverage Report</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; max-width: 60rem; }
    h1 { margin-bottom: 0.25rem; }
    .generated { color: #666; font-size: 0.85rem; margin: 0 0 1.5rem; }
    section.summary { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #ddd; }
    section.summary h2 { margin-top: 0; }
    p.overall { font-size: 1.05rem; }
    .delta { color: #555; font-weight: normal; }
    .stale-note { color: #666; font-size: 0.85rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.8rem; text-align: left; }
    th { background: #f4f4f4; }
    tr:nth-child(even) { background: #fafafa; }
    table.summary-table td:not(:first-child),
    table.summary-table th:not(:first-child) { text-align: right; }
    h2.files-heading { margin-top: 0; }
    code { background: #f4f4f4; padding: 0 0.25rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>NiiVue Coverage Report</h1>
  <p class="generated">Generated: ${new Date().toISOString()}</p>
${summarySection}
  <section>
    <h2 class="files-heading">Per-file coverage</h2>
    <table>
      <thead><tr><th>File</th><th>Statements</th></tr></thead>
      <tbody>
${fileRows}
      </tbody>
    </table>
  </section>
</body>
</html>
`
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔍 Scanning for coverage reports…')
  const coverageFiles = await findCoverageFiles()

  if (coverageFiles.length === 0) {
    console.warn('⚠️  No coverage files found. Run `pnpm turbo coverage` first.')
    process.exit(0)
  }

  console.log(`📂 Found ${coverageFiles.length} coverage file(s):`)
  for (const f of coverageFiles) {
    console.log(`   ${f.replace(repoRoot, '').replace(/^[\\/]/, '')}`)
  }

  // Only merge Istanbul coverage-final.json files
  const finalFiles = coverageFiles.filter((f) => f.endsWith('coverage-final.json'))
  const mergedData = mergeCoverageFinal(finalFiles)
  const fileCount = Object.keys(mergedData).length

  if (fileCount === 0) {
    console.warn('⚠️  No Istanbul coverage-final.json data found. Only json-summary or v8 reports present.')
    console.warn('    Re-run with reporter: [\'json\'] to produce coverage-final.json.')
  }

  const summary = bucketData(mergedData)

  // Optional baseline (previous summary.json fetched from gh-pages main report)
  let baseline = null
  const baselinePath = process.env.COVERAGE_BASELINE
  if (baselinePath && existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
      console.log(`📐 Using baseline: ${baselinePath}`)
    } catch (err) {
      console.warn(`⚠️  Could not parse baseline at ${baselinePath}: ${err.message}`)
    }
  }

  const reportUrl = process.env.COVERAGE_REPORT_URL || null
  const badgeUrl = process.env.COVERAGE_BADGE_URL || null

  const markdownTable = buildMarkdownTable(summary, { baseline, reportUrl, badgeUrl })
  const htmlReport = buildHtmlReport(mergedData, summary, baseline)
  const badgeJson = buildBadgeJson(summary, baseline)

  // Write outputs
  const outDir = path.join(repoRoot, 'coverage')
  const mergedDir = path.join(outDir, 'merged')
  mkdirSync(mergedDir, { recursive: true })

  writeFileSync(path.join(mergedDir, 'index.html'), htmlReport, 'utf8')
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')
  writeFileSync(path.join(outDir, 'summary.md'), markdownTable, 'utf8')
  writeFileSync(path.join(outDir, 'badge.json'), JSON.stringify(badgeJson, null, 2), 'utf8')

  console.log('\n' + markdownTable)
  console.log(`✅ Written:`)
  console.log(`   coverage/merged/index.html`)
  console.log(`   coverage/summary.json`)
  console.log(`   coverage/summary.md`)
  console.log(`   coverage/badge.json`)
}

// Run main() only when invoked as a script; importable for unit tests.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) {
  main().catch((err) => {
    console.error('❌ aggregate.mjs failed:', err)
    process.exit(1)
  })
}

// Exported for unit tests in aggregate.test.mjs.
export { synthesiseOverall, resolveOverall, buildBadgeJson, buildMarkdownTable, computeStats, BUCKETS }
