import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage } from './utils'

// Keyboard-shortcut LOGIC - the key->action mapping, modifier disambiguation, and
// the input-field guard - is covered exhaustively and in milliseconds by unit
// tests, with no WebGL load:
//   packages/niivue-react/src/test/keyboardShortcuts.test.ts    (matchesShortcut / formatShortcut)
//   packages/niivue-react/src/test/useKeyboardShortcuts.test.tsx (the hook: every mapping, guard, cleanup)
//
// What a unit test cannot prove is that the hook is actually mounted in the
// running app and that a real keypress flips real app state. That single
// integration claim is all this spec keeps - replacing 16 specs that each paid
// for a full WebGL load to assert pure handler logic. See tests/README.md for
// the unit-first test-placement policy.
test.describe('Keyboard shortcuts (smoke)', () => {
  test('a real keypress drives app state; a focused text field suppresses it', async ({ page }) => {
    await page.goto(BASE_URL)
    await loadTestImage(page)
    await page.locator('canvas').first().click()

    const sliceType = () => page.evaluate(() => (window as any).appProps?.sliceType.value)

    // '2' (sagittal) then '1' (axial): the UI hook is wired to the sliceType signal.
    await page.keyboard.press('2')
    await page.keyboard.press('1')
    await expect.poll(sliceType).toBe(0) // AXIAL

    // With focus in a text input the shortcut must be ignored: the input receives
    // the character and the view does not change.
    await page.evaluate(() => {
      const input = document.createElement('input')
      input.id = 'smoke-input'
      document.body.appendChild(input)
    })
    await page.locator('#smoke-input').focus()
    await page.keyboard.press('3') // would switch to coronal if not suppressed
    await expect(page.locator('#smoke-input')).toHaveValue('3')
    expect(await sliceType()).toBe(0) // still axial
  })
})
