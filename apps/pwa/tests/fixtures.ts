import { test as base } from '@playwright/test'
import { startCoverage, stopCoverage } from './utils'

/**
 * Extended Playwright test that collects V8 JS/CSS coverage for every test
 * and feeds it to monocart-reporter via addCoverageReport, which merges it
 * across all tests and generates the configured coverage reports
 * (coverage-final.json, etc.) in apps/pwa/coverage/e2e/.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await startCoverage(page)
    await use(page)
    await stopCoverage(page, testInfo)
  },
})

export { expect } from '@playwright/test'
