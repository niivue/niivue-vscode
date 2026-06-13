#!/usr/bin/env node
/**
 * scripts/coverage/aggregate.test.mjs
 *
 * Unit tests for the overall + delta synthesis in aggregate.mjs.
 *
 * Runs standalone with `node`: no Vitest, no test runner — just node:assert
 * with a tiny `test` shim. The aggregator is a one-off CI script with no
 * test framework dependency, and adding one would mean pulling Vitest into
 * the root package; not worth it for a few assertions.
 *
 *   node scripts/coverage/aggregate.test.mjs
 *
 * Bucket-agnostic: tests use BUCKETS[0] as the "this run measured" bucket
 * and the rest as "from baseline", so the suite is unaffected by future
 * BUCKETS additions or removals.
 */
import assert from 'node:assert/strict'
import { synthesiseOverall, resolveOverall, buildBadgeJson, BUCKETS } from './aggregate.mjs'

// The bucket-agnostic fixtures below assume BUCKETS has at least 2 entries
// (one to mark "measured this run", at least one more to receive "filled
// from baseline"). If the project layout ever collapses to a single bucket,
// the tests should fail loudly rather than vacuously pass.
assert.ok(BUCKETS.length >= 2, 'tests assume at least 2 buckets')

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

const zeroCounts = () => ({
  statements: { covered: 0, total: 0 },
  branches: { covered: 0, total: 0 },
  functions: { covered: 0, total: 0 },
  lines: { covered: 0, total: 0 },
})

const pct = (n) => (n.total === 0 ? null : Math.round((n.covered / n.total) * 1000) / 10)

// Build a summary stub matching what bucketData() produces.
// `measured` maps bucket index → per-metric counts (only `lines` required;
// others default to zero). Indices not present produce a zero-counts bucket.
function summaryWith(measured, overallLines = null) {
  const result = {}
  for (let i = 0; i < BUCKETS.length; i++) {
    const b = BUCKETS[i]
    const m = measured[i]
    const counts = zeroCounts()
    if (m?.lines) counts.lines = m.lines
    if (m?.statements) counts.statements = m.statements
    if (m?.branches) counts.branches = m.branches
    if (m?.functions) counts.functions = m.functions
    result[b.id] = {
      label: b.label,
      stats: {
        statements: pct(counts.statements),
        branches: pct(counts.branches),
        functions: pct(counts.functions),
        lines: pct(counts.lines),
      },
      counts,
    }
  }
  result._overall = {
    label: 'Overall',
    stats: { statements: null, branches: null, functions: null, lines: overallLines },
    counts: zeroCounts(),
  }
  return result
}

// Same as summaryWith but omits `counts` everywhere — simulates an old-schema
// baseline (the one currently deployed at niivue.github.io/.../coverage/main/).
function legacySummary(measuredPctByIndex, overallLines = null) {
  const result = {}
  for (let i = 0; i < BUCKETS.length; i++) {
    const b = BUCKETS[i]
    result[b.id] = { label: b.label, stats: { lines: measuredPctByIndex[i] ?? null } }
  }
  result._overall = { label: 'Overall', stats: { lines: overallLines } }
  return result
}

console.log('synthesiseOverall')

test('returns null when there is no baseline', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  assert.equal(synthesiseOverall(summary, null), null)
})

test('returns null when baseline lacks per-bucket counts (old schema)', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  const baseline = legacySummary({ 0: 84.3 }, 33.8)
  assert.equal(synthesiseOverall(summary, baseline), null)
})

test('folds baseline counts for unmeasured buckets, this run for measured', () => {
  // This run measured bucket 0 only.
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  // Baseline: bucket 0 = 30/51, every other bucket = 50/100.
  const baselineMeasured = { 0: { lines: { covered: 30, total: 51 } } }
  let baselineOtherCovered = 0
  let baselineOtherTotal = 0
  for (let i = 1; i < BUCKETS.length; i++) {
    baselineMeasured[i] = { lines: { covered: 50, total: 100 } }
    baselineOtherCovered += 50
    baselineOtherTotal += 100
  }
  const baseline = summaryWith(baselineMeasured)

  const synth = synthesiseOverall(summary, baseline)
  assert.equal(synth.partial, true)
  // This run's bucket 0 (43/51) + baseline for the remaining N-1 buckets.
  assert.equal(synth.counts.lines.covered, 43 + baselineOtherCovered)
  assert.equal(synth.counts.lines.total, 51 + baselineOtherTotal)
})

test('partial = true when a bucket is missing from both this run AND baseline', () => {
  // Regression for the case where, e.g., a new bucket was just added to
  // BUCKETS in this PR but baseline (from a previous main run) doesn't
  // know about it yet. Synthesis previously reported partial=false here,
  // which suppressed the "carried-over" disclosure on the overall — i.e.
  // the misleading-overall bug this function exists to prevent.
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  // Baseline knows about bucket 0 only.
  const baseline = summaryWith({ 0: { lines: { covered: 30, total: 51 } } })
  const synth = synthesiseOverall(summary, baseline)
  assert.equal(synth.partial, true, 'should flag partial even when baseline has no data for skipped buckets')
})

test('partial = false when every bucket ran this time', () => {
  const measured = {}
  let totalCovered = 0
  let totalLines = 0
  for (let i = 0; i < BUCKETS.length; i++) {
    measured[i] = { lines: { covered: 10 + i, total: 50 } }
    totalCovered += 10 + i
    totalLines += 50
  }
  const summary = summaryWith(measured)
  // Baseline has different (stale) numbers — should be ignored when this run
  // measured the same bucket.
  const baseline = summaryWith({ 0: { lines: { covered: 1, total: 50 } } })

  const synth = synthesiseOverall(summary, baseline)
  assert.equal(synth.partial, false)
  assert.equal(synth.counts.lines.covered, totalCovered)
  assert.equal(synth.counts.lines.total, totalLines)
})

console.log('\nresolveOverall')

test('partial run with new baseline → synthesised + apples-to-apples delta', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  // Baseline: bucket 0 was 30/51, others were 50/100 each.
  const baselineMeasured = { 0: { lines: { covered: 30, total: 51 } } }
  for (let i = 1; i < BUCKETS.length; i++) {
    baselineMeasured[i] = { lines: { covered: 50, total: 100 } }
  }
  const baseline = summaryWith(baselineMeasured, 50.7)

  const r = resolveOverall(summary, baseline)
  assert.equal(r.synthesised, true)
  assert.equal(r.deltaSuppressed, false)
  // synth bumped 30→43 covered in a 51-total bucket; expect a small positive
  // delta vs baseline's stored _overall (50.7).
  assert.ok(r.display > 50 && r.display < 55, `expected ~51%, got ${r.display}`)
  assert.equal(r.deltaAgainst, 50.7)
})

test('partial run with legacy baseline → delta suppressed, displays this run', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  summary._overall.stats.lines = 84.3
  const baseline = legacySummary({ 0: 30 }, 33.8)
  const r = resolveOverall(summary, baseline)
  assert.equal(r.synthesised, false)
  assert.equal(r.deltaSuppressed, true)
  assert.equal(r.partial, true)
  assert.equal(r.display, 84.3)
})

test('full run with legacy baseline → no synthesis, delta shown', () => {
  const measured = {}
  for (let i = 0; i < BUCKETS.length; i++) {
    measured[i] = { lines: { covered: 30, total: 100 } }
  }
  const summary = summaryWith(measured)
  summary._overall.stats.lines = 30.0
  const baseline = legacySummary({}, 25.0)
  const r = resolveOverall(summary, baseline)
  assert.equal(r.synthesised, false)
  assert.equal(r.deltaSuppressed, false)
  assert.equal(r.partial, false)
  assert.equal(r.display, 30.0)
  assert.equal(r.deltaAgainst, 25.0)
})

console.log('\nbuildBadgeJson')

test('badge uses synthesised value when baseline allows', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  summary._overall.stats.lines = 84.3 // bare partial-run value
  const baselineMeasured = { 0: { lines: { covered: 30, total: 51 } } }
  for (let i = 1; i < BUCKETS.length; i++) {
    baselineMeasured[i] = { lines: { covered: 50, total: 100 } }
  }
  const baseline = summaryWith(baselineMeasured)
  const badge = buildBadgeJson(summary, baseline)
  // Should NOT be the misleading 84.3% — should be the synthesised whole-
  // codebase number.
  assert.notEqual(badge.message, '84.3%')
  const value = Number(badge.message.replace('%', ''))
  assert.ok(value > 40 && value < 60, `expected ~50%, got ${badge.message}`)
})

test('badge falls back to bare overall when no baseline counts available', () => {
  const summary = summaryWith({ 0: { lines: { covered: 43, total: 51 } } })
  summary._overall.stats.lines = 84.3
  const baseline = legacySummary({}, 33.8)
  const badge = buildBadgeJson(summary, baseline)
  assert.equal(badge.message, '84.3%')
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
