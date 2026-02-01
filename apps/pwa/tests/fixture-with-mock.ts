import { test as base, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// Extend base test to mock external resources
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    // Mock external niivue.github.io requests with local test data
    await page.route('https://niivue.github.io/**', async (route) => {
      const url = route.request().url()
      console.log('Intercepting:', url)

      // For now, just continue the request
      // TODO: Serve from local test assets
      await route.continue()
    })

    await use(page)
  },
})

export { expect }
