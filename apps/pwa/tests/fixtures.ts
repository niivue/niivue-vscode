import { test as base } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Extended test fixture that intercepts external network requests
 * and serves mock responses or local test files.
 *
 * This allows tests to work without external network access.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Intercept requests to niivue.github.io and mock them
    await page.route('https://niivue.github.io/**', async (route) => {
      const url = route.request().url()

      // For demo images, serve local DICOM file as fallback
      if (
        url.includes('mni152.nii.gz') ||
        url.includes('pcasl.nii.gz') ||
        url.includes('CT_pitch.dcm')
      ) {
        // Serve local DICOM file for all image requests
        const localPath = path.join(__dirname, '..', 'test', 'assets', 'enh.dcm')
        const buffer = fs.readFileSync(localPath)

        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: buffer,
        })
      }
      // For mesh files (.mz3, .curv), create minimal valid responses
      else if (url.endsWith('.mz3')) {
        // Create a minimal MZ3 mesh file header
        // MZ3 format starts with magic bytes
        const minimalMesh = Buffer.alloc(256)
        minimalMesh.write('MZ3', 0) // Magic number

        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: minimalMesh,
        })
      } else if (url.endsWith('.curv')) {
        // Create minimal curv file
        const minimalCurv = Buffer.alloc(128)

        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: minimalCurv,
        })
      } else {
        // For any other requests, return 404
        await route.fulfill({
          status: 404,
          body: 'Not found',
        })
      }
    })

    // Intercept requests to invalid.example.com for error testing
    await page.route('https://invalid.example.com/**', async (route) => {
      // Return 404 to test error handling
      await route.fulfill({
        status: 404,
        body: 'Not found',
      })
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'
