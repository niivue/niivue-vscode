import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduced retries to save time
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined, // 2 workers for faster execution
  /* Global timeout for all tests - 5 minutes total */
  globalTimeout: 5 * 60 * 1000, // 5 minutes total for entire test suite
  /* Timeout for each test - shorter default */
  timeout: 30 * 1000, // 30 seconds per test - should be enough for most tests
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }], // Don't auto-open browser with report
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['monocart-reporter', {
      name: 'NiiVue PWA Coverage',
      outputFile: './coverage/e2e/index.html',
      coverage: {
        entryFilter: (entry: { url: string }) => entry.url.startsWith('http://localhost:4000'),
        // niivue-react files arrive repo-root-relative (because Vite resolves
        // them via the `../../packages/niivue-react/src` alias). pwa's own
        // files arrive Vite-root-relative as `src/...` — Vite treats apps/pwa
        // as the project root. Canonicalize the pwa case so both the filter
        // and the aggregator's bucket matcher catch them.
        sourcePath: (sourcePath: string) =>
          sourcePath.startsWith('src/') ? 'apps/pwa/' + sourcePath : sourcePath,
        sourceFilter: (sourcePath: string) =>
          sourcePath.includes('apps/pwa/src') ||
          sourcePath.includes('packages/niivue-react/src'),
        reports: ['v8', 'json', 'json-summary', 'lcov'],
        outputDir: './coverage/e2e',
      },
    }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Action timeout - aggressive for CI */
    actionTimeout: 5 * 1000, // 5 seconds for clicks, typing, etc.
    /* Navigation timeout - aggressive for CI */
    navigationTimeout: 10 * 1000, // 10 seconds for page.goto()
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Temporarily disabled for faster CI runs - can be re-enabled as needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /*
   * Build the app and serve it via `vite preview` so source maps have full
   * paths (e.g. `apps/pwa/src/Pwa.tsx`, `packages/niivue-react/src/...`).
   * `--base /` overrides the GitHub Pages base so tests can hit the root.
   * For local iteration, run `pnpm dev` separately and playwright will
   * reuseExistingServer.
   */
  webServer: {
    command:
      'node copy-assets.mjs && vite build --base / && vite preview --base / --port 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 60 * 1000, // 5 minutes — production build can take a while
  },

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
})
