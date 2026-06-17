import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(path.resolve(dir, '../package.json'), 'utf8'))

type Keybinding = { command: string; key: string; mac?: string; when?: string }
const keybindings: Keybinding[] = pkg.contributes?.keybindings ?? []

describe('contributed keybindings', () => {
  it('contributes the niivue shortcut keybindings', () => {
    expect(keybindings.length).toBeGreaterThan(0)
    expect(keybindings.every((k) => k.command.startsWith('niivue.'))).toBe(true)
  })

  // Regression test for niivue/niivue-vscode#223: the niivue commands are
  // no-ops (the webview's own keydown listener does the work), so a binding
  // that stays active while a VS Code input box is focused merely *swallows*
  // the key. Without `!inputFocus`, single-key bindings like "1" or "s" eat
  // keystrokes meant for Quick Open / the command palette ("the top box").
  it('gates every keybinding behind the editor having focus (not an input box)', () => {
    for (const kb of keybindings) {
      expect(kb.when, `keybinding for ${kb.command} must declare a when-clause`).toBeTruthy()
      expect(
        kb.when,
        `keybinding for ${kb.command} ("${kb.key}") must require the niivue editor`,
      ).toContain('activeCustomEditorId == niiVue.default')
      expect(
        kb.when,
        `keybinding for ${kb.command} ("${kb.key}") must be disabled while a VS Code input is focused (#223)`,
      ).toContain('!inputFocus')
    }
  })

  // The bare printable keys are the ones that actually break typing in the
  // top box, so guard them explicitly in case the list grows later.
  it('guards the single printable-key shortcuts in particular', () => {
    const printable = keybindings.filter((k) => /^[a-z0-9]$/i.test(k.key))
    expect(printable.length).toBeGreaterThan(0)
    expect(printable.every((k) => k.when?.includes('!inputFocus'))).toBe(true)
  })
})
