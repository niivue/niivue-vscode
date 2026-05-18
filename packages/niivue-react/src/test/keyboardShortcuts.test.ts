import { describe, expect, it } from 'vitest'
import type { KeyboardShortcut } from '../constants/keyboardShortcuts'
import { matchesShortcut } from '../constants/keyboardShortcuts'

/** Build a KeyboardEvent-shaped object — only the four fields matchesShortcut inspects. */
function evt(opts: { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }) {
  return {
    key: opts.key,
    ctrlKey: !!opts.ctrl,
    metaKey: !!opts.meta,
    shiftKey: !!opts.shift,
    altKey: !!opts.alt,
  } as unknown as KeyboardEvent
}

const bareA: KeyboardShortcut = { key: 'a', description: 'a' }
const ctrlS: KeyboardShortcut = { key: 's', ctrl: true, description: 'save' }
const ctrlShiftP: KeyboardShortcut = { key: 'p', ctrl: true, shift: true, description: 'palette' }
const altF: KeyboardShortcut = { key: 'f', alt: true, description: 'file' }
const arrow: KeyboardShortcut = { key: 'ArrowRight', description: 'right' }

describe('matchesShortcut', () => {
  it('matches a bare key', () => {
    expect(matchesShortcut(evt({ key: 'a' }), bareA)).toBe(true)
  })

  it('does not match a different key', () => {
    expect(matchesShortcut(evt({ key: 'b' }), bareA)).toBe(false)
  })

  it('matches case-insensitively on the key', () => {
    expect(matchesShortcut(evt({ key: 'A' }), bareA)).toBe(true)
  })

  it('does not match when extra modifier is held (bare shortcut, ctrl pressed)', () => {
    expect(matchesShortcut(evt({ key: 'a', ctrl: true }), bareA)).toBe(false)
  })

  it('matches Ctrl+S', () => {
    expect(matchesShortcut(evt({ key: 's', ctrl: true }), ctrlS)).toBe(true)
  })

  it('treats metaKey as equivalent to ctrlKey (Mac compatibility)', () => {
    expect(matchesShortcut(evt({ key: 's', meta: true }), ctrlS)).toBe(true)
  })

  it('does not match Ctrl+S when ctrl is not held', () => {
    expect(matchesShortcut(evt({ key: 's' }), ctrlS)).toBe(false)
  })

  it('matches Ctrl+Shift+P', () => {
    expect(matchesShortcut(evt({ key: 'p', ctrl: true, shift: true }), ctrlShiftP)).toBe(true)
  })

  it('does not match Ctrl+Shift+P when shift is missing', () => {
    expect(matchesShortcut(evt({ key: 'p', ctrl: true }), ctrlShiftP)).toBe(false)
  })

  it('matches Alt+F', () => {
    expect(matchesShortcut(evt({ key: 'f', alt: true }), altF)).toBe(true)
  })

  it('does not match Alt+F when Ctrl is also held (extra modifier)', () => {
    expect(matchesShortcut(evt({ key: 'f', alt: true, ctrl: true }), altF)).toBe(false)
  })

  it('matches named keys like ArrowRight', () => {
    expect(matchesShortcut(evt({ key: 'ArrowRight' }), arrow)).toBe(true)
  })
})
