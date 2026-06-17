import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage } from './utils'

// Keyboard-shortcut LOGIC - the key->action mapping, modifier disambiguation, and
// the input-field guard - is covered exhaustively and in milliseconds by unit
// tests, with no WebGL load:
//   packages/niivue-react/src/test/keyboardShortcuts.test.ts    (matchesShortcut / formatShortcut)
//   packages/niivue-react/src/test/useKeyboardShortcuts.test.tsx (the hook: every mapping, guard, cleanup)
//
// What a unit test cannot prove is that the hook is actually mounted in the
// running app, that a real keypress flips real app state, and that NiiVue's own
// built-in canvas hotkeys stay out of the way. Those integration claims are all
// this spec keeps - replacing the full per-key e2e matrix that each paid for a
// WebGL load to assert pure handler logic. See tests/README.md for the
// unit-first test-placement policy.
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

  test('clip plane advances exactly once per "c" press (#224)', async ({ page }) => {
    // Regression for #224. The app's keydown handler advances the clip plane for
    // every selected canvas; NiiVue's own canvas handler used to advance the
    // focused canvas again on keyup, so a single "c" landed on index 2 instead of
    // 1. That NiiVue's clipPlaneHotKey is actually disabled in the running app is
    // an integration claim a jsdom unit test can't make (it has no real NiiVue
    // canvas) - the hook test only proves the app fires onCycleClipPlane once - so
    // the one-press-one-step guarantee is verified here against the real viewer.
    await page.goto(BASE_URL)
    await loadTestImage(page)
    await page.locator('canvas').first().click()

    const clipPlaneIndex = () =>
      page.evaluate(() => (window as any).appProps?.nvArray.value[0]?.currentClipPlaneIndex)
    await page.keyboard.press('c')
    await expect.poll(clipPlaneIndex).toBe(1)
  })
})
