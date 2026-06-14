import { expect, test } from './fixtures';
import { BASE_URL, loadTestImage } from './utils';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  await page.goto(BASE_URL);
  await loadTestImage(page);
});

async function getDebugValue(page, request) {
  return page.evaluate((req) => {
    const appProps = (window as any).appProps;
    if (!appProps) return undefined;
    switch (req) {
      case 'getSliceType':
        return appProps.sliceType.value;
      case 'getInterpolation':
        return appProps.settings.value.interpolation;
      case 'getColorbar':
        return appProps.settings.value.colorbar;
      case 'getRadiological':
        return appProps.settings.value.radiologicalConvention;
      case 'getCrosshair':
        return appProps.settings.value.showCrosshairs;
      case 'getZoomMode':
        return appProps.settings.value.zoomDragMode;
      case 'getHideUI':
        return appProps.hideUI.value;
      case 'getCrosshairPos':
        return appProps.nvArray.value[0]?.scene?.crosshairPos;
      case 'getPan':
        return appProps.nvArray.value[0]?.scene?.pan2Dxyzmm;
      default:
        return undefined;
    }
  }, request);
}

// Each shortcut updates a Preact signal in the keydown handler. Rather than
// sleep a fixed amount and hope the signal has propagated (flaky under CI CPU
// contention), poll the same app-state read until it reflects the change.
function poll(page, request) {
  return expect.poll(() => getDebugValue(page, request));
}

test.describe('Keyboard Shortcuts', () => {
  test('should cycle view modes with "v"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initialSliceType = await getDebugValue(page, 'getSliceType');
    await page.keyboard.press('v');
    // Slice type should change when cycling
    await poll(page, 'getSliceType').not.toBe(initialSliceType);

    // Cycle should wrap around eventually (0 to 4)
    const newSliceType = await getDebugValue(page, 'getSliceType');
    expect(newSliceType).toBeGreaterThanOrEqual(0);
    expect(newSliceType).toBeLessThanOrEqual(4);
  });

  test('should change view to Axial with "1"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    await page.keyboard.press('2'); // First switch away from Axial
    await page.keyboard.press('1');
    await poll(page, 'getSliceType').toBe(0); // Axial
  });

  test('should change view to Coronal with "3"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    await page.keyboard.press('3');
    await poll(page, 'getSliceType').toBe(1); // Coronal
  });

  test('should change view to Render with "4"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    await page.keyboard.press('4');
    await poll(page, 'getSliceType').toBe(4); // Render (SLICE_TYPE.RENDER is 4)
  });

  test('should change view to Multiplanar+Render with "5"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    await page.keyboard.press('5');
    await poll(page, 'getSliceType').toBe(3); // Multiplanar (SLICE_TYPE.MULTIPLANAR is 3)
  });

  test('should toggle interpolation with "i"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getInterpolation');
    await page.keyboard.press('i');
    await poll(page, 'getInterpolation').toBe(!initial);
  });

  test('should toggle colorbar with "b"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getColorbar');
    await page.keyboard.press('b');
    await poll(page, 'getColorbar').toBe(!initial);
  });

  test('should toggle radiological convention with "x"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getRadiological');
    await page.keyboard.press('x');
    await poll(page, 'getRadiological').toBe(!initial);
  });

  test('should toggle crosshairs with "m"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getCrosshair');
    await page.keyboard.press('m');
    await poll(page, 'getCrosshair').toBe(!initial);
  });

  test('should toggle zoom mode with "z"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getZoomMode');
    await page.keyboard.press('z');
    await poll(page, 'getZoomMode').toBe(!initial);
  });

  test('should toggle UI visibility with "u"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initial = await getDebugValue(page, 'getHideUI');
    await page.keyboard.press('u');
    // hideUI cycles: 3 -> 2 -> 0 -> 3
    await poll(page, 'getHideUI').not.toBe(initial);
  });

  test('should reset view with "r"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    // Press 'r' to reset pan/zoom
    await page.keyboard.press('r');
    await poll(page, 'getPan').toEqual([0, 0, 0, 1]); // Reset to default pan
  });

  test('should move crosshair with "h", "j", "k", "l"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initialPos = await getDebugValue(page, 'getCrosshairPos');

    await page.keyboard.press('l'); // Right
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[0])
      .toBeGreaterThan(initialPos[0]);

    await page.keyboard.press('h'); // Left
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[0])
      .toBeCloseTo(initialPos[0]);

    await page.keyboard.press('j'); // Posterior (Y increases in NiiVue vox space for posterior? Actually depends on orientation, but it should change)
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[1])
      .not.toBe(initialPos[1]);

    await page.keyboard.press('k'); // Anterior
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[1])
      .toBeCloseTo(initialPos[1]);
  });

  test('should move crosshair superior/inferior with "Shift+U" and "Shift+D"', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    const initialPos = await getDebugValue(page, 'getCrosshairPos');

    await page.keyboard.press('Shift+U');
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[2])
      .toBeGreaterThan(initialPos[2]);

    await page.keyboard.press('Shift+D');
    await expect
      .poll(async () => (await getDebugValue(page, 'getCrosshairPos'))[2])
      .toBeCloseTo(initialPos[2]);
  });

  test('should NOT trigger shortcuts when typing in input fields', async ({ page }) => {
    // If there's an input field, focus it and press 'v'
    // Let's create an input field for testing if none exists
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'test-input';
      document.body.appendChild(input);
    });

    const input = page.locator('#test-input');
    await input.focus();

    const initialSliceType = await getDebugValue(page, 'getSliceType');
    await page.keyboard.press('v');
    // Awaiting the input value (web-first, auto-retrying) proves the keypress
    // was consumed by the input rather than dropped — without a fixed sleep.
    // Once the input shows the char, the shortcut, if it were going to fire,
    // already would have; the slice type must be unchanged.
    await expect(input).toHaveValue('v');
    const newSliceType = await getDebugValue(page, 'getSliceType');
    expect(newSliceType).toBe(initialSliceType);
  });
});
