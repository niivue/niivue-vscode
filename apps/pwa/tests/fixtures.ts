import { test as base } from '@playwright/test'
import { startCoverage, stopCoverage } from './utils'

/**
 * Extended Playwright test that automatically collects V8 JS/CSS coverage for
 * every test.  Monocart-reporter picks up the attached 'coverage' payload and
 * merges it across all tests into a single source-mapped HTML report.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await startCoverage(page)
    await use(page)
    await stopCoverage(page, testInfo)
  },
})

export { expect } from '@playwright/test'
