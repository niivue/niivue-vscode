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
  /* Retry on CI only — a net, not a crutch. */
  retries: process.env.CI ? 1 : 0,
  /*
   * Worker count is GLOBAL in Playwright (there is no per-project worker cap),
   * so true serialization of the heavy WebGL lane is done by a separate
   * `--workers=1` invocation (see package.json `test:e2e:webgl`), not here.
   * This default applies to the parallel `@dom` fast lane and to ad-hoc runs.
   */
  workers: process.env.CI ? 2 : undefined,
  /*
   * No `globalTimeout`. A suite-wide wall-clock cap turns contention or a
   * (deliberately serial) heavy lane into a nondeterministic failure of the
   * whole run. The CI job's `timeout-minutes` is the real outer bound; per-test
   * `timeout` below bounds individual hangs.
   */
  /* Per-test failsafe — generous so software-WebGL renders under CPU contention
   * never make a correct test time out. Not a happy-path budget. */
  timeout: 60 * 1000,
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
        reports: ['v8', 'istanbul', 'json', 'json-summary', 'lcov'],
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
    /*
     * Generous failsafes, NOT correctness budgets. The old 5 s actionTimeout
     * was the direct cause of the #238 flakiness: a click on a visible, correct
     * button can exceed 5 s while a parallel worker pegs CPU on software WebGL.
     * Waits key on app state (see tests/utils.ts); these only bound a genuine hang.
     */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
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
   * Serve the production build via `vite preview` so source maps have full
   * paths (e.g. `apps/pwa/src/Pwa.tsx`, `packages/niivue-react/src/...`).
   * `--base /` overrides the GitHub Pages base so tests can hit the root.
   *
   * The build is intentionally NOT part of this command: the two e2e lanes
   * (fast + serial webgl) are separate Playwright invocations that must share
   * ONE build, so `vite build --base /` runs once up front (see package.json
   * `test:e2e:build`; `test:e2e` and CI run it before the lanes). `vite preview`
   * here is cheap to (re)start per invocation. For local iteration, `pnpm dev`
   * on :4000 is reused via reuseExistingServer.
   */
  webServer: {
    command: 'vite preview --base / --port 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 2 * 60 * 1000,
  },

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
})
