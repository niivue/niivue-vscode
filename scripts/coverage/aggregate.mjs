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

  const pct = (n) => (n.total === 0 ? null : Math.round((n.covered / n.total) * 1000) / 10)
  return {
    statements: pct(totals.statements),
    branches: pct(totals.branches),
    functions: pct(totals.functions),
    lines: pct(totals.lines),
  }
}

function bucketData(istanbulData) {
  const result = {}
  for (const bucket of BUCKETS) {
    const subset = {}
    for (const [key, value] of Object.entries(istanbulData)) {
      if (bucket.match(key)) subset[key] = value
    }
    result[bucket.id] = { label: bucket.label, stats: computeStats(subset) }
  }
  result._overall = { label: 'Overall', stats: computeStats(istanbulData) }
  return result
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

function buildBadgeJson(summary) {
  const overall = summary._overall?.stats?.lines
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

function buildMarkdownTable(summary, opts = {}) {
  const { baseline = null, reportUrl = null, badgeUrl = null } = opts

  const overall = summary._overall?.stats?.lines ?? null
  const baseOverall = baseline?._overall?.stats?.lines ?? null

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

  const overallCell = renderCell(overall, baseOverall)
  if (overallCell.text !== 'N/A') {
    if (overallCell.stale) anyStale = true
    if (overall !== null) {
      const delta = deltaStr(overall, baseOverall)
      lines.push(`**Overall line coverage: ${pctStr(overall)}${delta ? ` ${delta.trim()} vs \`main\`` : ''}**`)
    } else {
      lines.push(`**Overall line coverage: ${overallCell.text}**`)
    }
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

function buildHtmlReport(mergedData) {
  const fileRows = Object.entries(mergedData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, cov]) => {
      const stmtTotal = Object.keys(cov.s).length
      const stmtCovered = Object.values(cov.s).filter((c) => c > 0).length
      const pct = stmtTotal === 0 ? 'N/A' : `${Math.round((stmtCovered / stmtTotal) * 100)}%`
      const relPath = file.replace(repoRoot, '').replace(/^[\\/]/, '')
      return `<tr><td>${relPath}</td><td>${pct} (${stmtCovered}/${stmtTotal})</td></tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NiiVue Coverage Report</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.8rem; text-align: left; }
    th { background: #f4f4f4; }
    tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body>
  <h1>NiiVue Coverage Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <table>
    <thead><tr><th>File</th><th>Statements</th></tr></thead>
    <tbody>
${fileRows}
    </tbody>
  </table>
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
  const htmlReport = buildHtmlReport(mergedData)
  const badgeJson = buildBadgeJson(summary)

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

main().catch((err) => {
  console.error('❌ aggregate.mjs failed:', err)
  process.exit(1)
})
