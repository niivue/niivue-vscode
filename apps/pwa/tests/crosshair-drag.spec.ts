import { expect, test } from './fixtures'
import { BASE_URL, loadTestImage } from './utils'

/**
 * Regression for niivue/niivue-vscode#252: a left drag on the canvas must move
 * the crosshair. Two migration bugs broke this and are guarded here together:
 *  - The default dual (WebGPU+WebGL2) build skips niivue's `initInteraction`
 *    when no WebGPU adapter is available (VS Code webviews, many browsers,
 *    headless CI), so clicks/drags did nothing. We force the WebGL2 backend.
 *  - The pane is draggable for reordering, so a press on the canvas could start
 *    an HTML5 drag (a "ghost screenshot") instead; `handleDragStart` cancels the
 *    reorder when the press is over the canvas. This test keeps the pane
 *    draggable (the real-world setup) to cover that path too.
 */
test('a left drag on the canvas moves the crosshair (not a reorder ghost)', async ({ page }) => {
  await page.goto(BASE_URL)
  await loadTestImage(page)

  const crosshair = () =>
    page.evaluate(() =>
      JSON.stringify((window as { appProps: any }).appProps.nvArray.value[0].model.scene.crosshairPos),
    )
  const before = await crosshair()

  const box = (await page.locator('.nv-pane').first().boundingBox())!
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.63, box.y + box.height * 0.6, { steps: 12 })
  await page.mouse.up()

  await expect.poll(crosshair, { timeout: 5000 }).not.toBe(before)
})
