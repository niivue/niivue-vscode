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

  test('each crosshair key press moves exactly one voxel', async ({ page }) => {
    // Regression: once NiiVue's own key listener was removed (#224), nothing
    // handled H/J/K/L any more and the crosshair stayed put. The unit tests mock
    // NiiVue, so this checks the real viewer: one press must equal one
    // moveCrosshairInVox step, which fails both when the key is unhandled and
    // when it is applied twice (by the app and by NiiVue's listener).
    await page.goto(BASE_URL)
    await loadTestImage(page)
    await page.locator('canvas').first().click()

    const position = () =>
      page.evaluate(() => Array.from((window as any).appProps.nvArray.value[0].crosshairPos as number[]))
    const moveInVox = (step: number[]) =>
      page.evaluate((s) => (window as any).appProps.nvArray.value[0].moveCrosshairInVox(...s), step)
    const change = (from: number[], to: number[]) => to.map((v, i) => v - from[i])
    const isClose = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)

    for (const [key, step] of [
      ['l', [1, 0, 0]],
      ['k', [0, 1, 0]],
    ] as const) {
      // The click left the crosshair between voxel centers; the first step snaps
      // it onto the grid, so measure the second one.
      await moveInVox([...step])
      const start = await position()
      await moveInVox([...step])
      const oneVoxel = change(start, await position())
      expect(oneVoxel.some((v) => Math.abs(v) > 1e-6), `${key}: a voxel step moves the crosshair`).toBe(true)

      const beforePress = await position()
      await page.keyboard.press(key)
      await expect
        .poll(async () => isClose(change(beforePress, await position()), oneVoxel), {
          message: `${key}: moves one voxel (${oneVoxel})`,
        })
        .toBe(true)
      // Let any second handler for the same press land before the final check.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      expect(isClose(change(beforePress, await position()), oneVoxel), `${key}: moved once`).toBe(true)
    }
  })
})
