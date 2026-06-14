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
    // Pwa.tsx only exposes `window.appProps` for tests when `import.meta.env.DEV`
    // is true OR `window.PLAYWRIGHT_TEST` is set. We run e2e against a production
    // build (no DEV), so flag the page as under test before the app boots.
    await page.addInitScript(() => {
      ;(window as any).PLAYWRIGHT_TEST = true
    })

    // Determinism: strip CSS transitions/animations so visibility and layout
    // assertions never race animation timing under CPU-contended CI. We both
    // emulate `prefers-reduced-motion` (which the app/menus may honor) and
    // force-disable via an injected stylesheet, applied as early as possible
    // and re-applied on DOMContentLoaded in case <head> wasn't ready yet.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const css =
        '*,*::before,*::after{transition:none!important;animation:none!important;' +
        'animation-duration:0s!important;animation-delay:0s!important;' +
        'transition-duration:0s!important;transition-delay:0s!important;' +
        'scroll-behavior:auto!important}'
      const inject = () => {
        if (document.getElementById('pw-no-animations')) return
        const style = document.createElement('style')
        style.id = 'pw-no-animations'
        style.textContent = css
        ;(document.head || document.documentElement).appendChild(style)
      }
      inject()
      document.addEventListener('DOMContentLoaded', inject)
    })

    await startCoverage(page)
    await use(page)
    await stopCoverage(page, testInfo)
  },
})

export { expect } from '@playwright/test'
