import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4000/'

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});


test.describe('app', () => {
  test('adds 1 + 2 to equal 3', () => {
    const expected = 3;
    expect(1 + 2).toBe(expected);
  });

  test('displays home screen', async ({ page }) => {
    await page.goto(BASE_URL);

    expect(await page.textContent('text=/Home/i')).toBeTruthy();
    expect(await page.textContent('text=/Add Image/i')).toBeTruthy();
    expect(await page.textContent('text=/View/i')).toBeTruthy();
    expect(await page.textContent('text=/Bookmarklet/i')).toBeTruthy();
    expect(await page.textContent('text=/Drop Files to load images/i')).toBeTruthy();
  });

  test('loads a test image', async ({ page }) => {
    await page.goto(BASE_URL);

    await loadTestImage(page);

    expect(await page.waitForSelector('canvas')).toBeTruthy();
    expect(await page.$$('canvas')).toHaveLength(1);

    await loadTestImage(page);
    expect(await page.$$('canvas')).toHaveLength(2);
  });

  test('loads an image and checks the menu bar', async ({ page }) => {
    await page.goto(BASE_URL);

    await loadTestImage(page);

    expect(await page.waitForSelector('canvas')).toBeTruthy();
    expect(await page.$$('canvas')).toHaveLength(1);

    const menuBar = ['Home', 'Add Image', 'View', 'ColorScale', 'Overlay', 'Header']
    for (const item of menuBar) {
      expect(await page.textContent(`text=/${item}/i`)).toBeTruthy();
    }
  });

  test('opens the example image via the menu bar', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.click('data-testid=menu-item-dropdown-Add Image');
    await page.click('text=/Example Image/i');

    expect(await page.waitForSelector('canvas')).toBeTruthy();
    expect(await page.$$('canvas')).toHaveLength(1);
  });


});

async function loadTestImage(page) {
  const testLink = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz';
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message);
}