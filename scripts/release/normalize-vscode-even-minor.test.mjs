#!/usr/bin/env node
/**
 * scripts/release/normalize-vscode-even-minor.test.mjs
 *
 * Unit tests for the even-minor stable normalizer.
 *
 * Runs standalone with `node`: no Vitest, no test runner, just node:assert
 * with the same tiny `test` shim as scripts/coverage/aggregate.test.mjs.
 * Importing the module does not execute its file-mutating body (guarded by
 * the `invokedDirectly` check), so only the pure `toEvenMinor` is exercised.
 *
 *   node scripts/release/normalize-vscode-even-minor.test.mjs
 */
import assert from 'node:assert/strict'
import { toEvenMinor } from './normalize-vscode-even-minor.mjs'

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

console.log('toEvenMinor: even minors are left untouched')

test('even minor, patch 0 is a no-op', () => {
  assert.equal(toEvenMinor('2.10.0'), '2.10.0')
})

test('even minor with a non-zero patch keeps its patch', () => {
  // Stable patch releases stay on the even minor; they must not be reset.
  assert.equal(toEvenMinor('2.10.4'), '2.10.4')
})

test('minor 0 counts as even', () => {
  assert.equal(toEvenMinor('3.0.0'), '3.0.0')
})

console.log('\ntoEvenMinor: odd minors round up to the next even minor')

test('the historical anomaly 2.9.0 → 2.10.0', () => {
  assert.equal(toEvenMinor('2.9.0'), '2.10.0')
})

test('odd minor resets patch to 0 (escaping the pre-release lane)', () => {
  assert.equal(toEvenMinor('2.9.3'), '2.10.0')
})

test('a minor bump landing odd is pushed even: 3.1.0 → 3.2.0', () => {
  assert.equal(toEvenMinor('3.1.0'), '3.2.0')
})

test('a high odd minor rounds up too: 2.11.56 → 2.12.0', () => {
  assert.equal(toEvenMinor('2.11.56'), '2.12.0')
})

console.log('\ntoEvenMinor: input validation')

test('rejects a non-bare version (pre-release suffix)', () => {
  assert.throws(() => toEvenMinor('2.9.0-beta.1'), /bare M\.m\.p/)
})

test('rejects a two-segment version', () => {
  assert.throws(() => toEvenMinor('2.9'), /bare M\.m\.p/)
})

console.log('\ninvariant vs. the pre-release encoder (no channel collision)')

// Mirrors scripts/release/encode-prerelease-versions.mjs `toVscodePreRelease`:
//   preMinor = minor + 1 + (minor % 2)   (next odd strictly above next-stable)
// If you change that formula, update this mirror. The property under test is
// the one this normalizer exists to guarantee: for any changesets next-stable,
// the pre-release minor (odd) is exactly one above the normalized stable minor
// (even), so the two Marketplace channels can never land on the same minor.
const preMinorOf = (nextStable) => {
  const minor = Number(nextStable.split('.')[1])
  return minor + 1 + (minor % 2)
}
const stableMinorOf = (nextStable) => Number(toEvenMinor(nextStable).split('.')[1])

test('pre minor === normalized stable minor + 1 for next-stable 2.8 to 2.15', () => {
  for (let m = 8; m <= 15; m++) {
    const nextStable = `2.${m}.0`
    const stableMinor = stableMinorOf(nextStable)
    const preMinor = preMinorOf(nextStable)
    assert.equal(stableMinor % 2, 0, `stable minor ${stableMinor} must be even (${nextStable})`)
    assert.equal(preMinor % 2, 1, `pre minor ${preMinor} must be odd (${nextStable})`)
    assert.equal(
      preMinor,
      stableMinor + 1,
      `expected pre ${preMinor} === stable ${stableMinor} + 1 for next-stable ${nextStable}`,
    )
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
