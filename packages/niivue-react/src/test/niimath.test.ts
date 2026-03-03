import { describe, expect, it } from 'vitest'
import { parseNiimathCommands } from '../niimathParser'
import type { Operators } from '@niivue/niimath'

// Minimal mock operators for testing the parser
const mockOperators: Operators = {
  add: { args: ['input'], help: 'add following input' },
  mul: { args: ['input'], help: 'multiply' },
  thr: { args: ['number'], help: 'threshold' },
  s: { args: ['sigma'], help: 'smooth' },
  bin: { help: 'binarize' },
  abs: { help: 'absolute value' },
  dog: { args: ['sPos', 'sNeg'], help: 'difference of gaussian' },
}

describe('parseNiimathCommands', () => {
  it('parses a single operation with one argument', () => {
    expect(parseNiimathCommands('-add 5', mockOperators)).toEqual([
      { op: 'add', args: ['5'] },
    ])
  })

  it('parses multiple operations', () => {
    expect(parseNiimathCommands('-add 5 -mul 2 -thr 100', mockOperators)).toEqual([
      { op: 'add', args: ['5'] },
      { op: 'mul', args: ['2'] },
      { op: 'thr', args: ['100'] },
    ])
  })

  it('parses operations with no arguments', () => {
    expect(parseNiimathCommands('-bin -abs', mockOperators)).toEqual([
      { op: 'bin', args: [] },
      { op: 'abs', args: [] },
    ])
  })

  it('parses operations with multiple arguments', () => {
    expect(parseNiimathCommands('-dog 2 3.2', mockOperators)).toEqual([
      { op: 'dog', args: ['2', '3.2'] },
    ])
  })

  it('handles mixed arg counts', () => {
    expect(parseNiimathCommands('-add 5 -bin -s 2.5', mockOperators)).toEqual([
      { op: 'add', args: ['5'] },
      { op: 'bin', args: [] },
      { op: 's', args: ['2.5'] },
    ])
  })

  it('handles extra whitespace', () => {
    expect(parseNiimathCommands('  -add  5   -bin  ', mockOperators)).toEqual([
      { op: 'add', args: ['5'] },
      { op: 'bin', args: [] },
    ])
  })

  it('throws on missing dash prefix', () => {
    expect(() => parseNiimathCommands('add 5', mockOperators)).toThrow(
      "Expected operation starting with '-'",
    )
  })

  it('throws on unknown operation', () => {
    expect(() => parseNiimathCommands('-unknown', mockOperators)).toThrow(
      'Unknown niimath operation: -unknown',
    )
  })

  it('throws on insufficient arguments', () => {
    expect(() => parseNiimathCommands('-dog 2', mockOperators)).toThrow(
      'Operation -dog expects 2 argument(s), got 1',
    )
  })

  it('returns empty array for empty input', () => {
    expect(parseNiimathCommands('', mockOperators)).toEqual([])
    expect(parseNiimathCommands('   ', mockOperators)).toEqual([])
  })
})
