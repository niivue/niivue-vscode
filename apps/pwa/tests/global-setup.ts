import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...')

  const testAssetsDir = path.resolve(__dirname, '..', 'test', 'assets')
  const pwaRoot = path.resolve(__dirname, '..')
  // public/ for vite dev server; build/ for vite preview. Playwright starts
  // webServer (which runs vite build) before globalSetup, so by the time we
  // run, build/ already exists — we just have to drop the test images into
  // it so vite preview can serve them.
  const targets = ['public', 'build']

  try {
    const files = await fs.readdir(testAssetsDir)
    for (const target of targets) {
      const targetDir = path.join(pwaRoot, target)
      if (target === 'public') {
        await fs.mkdir(targetDir, { recursive: true })
      } else if (!existsSync(targetDir)) {
        // No build/ yet (likely local dev with reuseExistingServer hitting
        // vite dev on :4000). Skip; public/ above is enough.
        continue
      }
      for (const file of files) {
        await fs.copyFile(
          path.join(testAssetsDir, file),
          path.join(targetDir, file),
        )
      }
      console.log(`Copied ${files.length} test asset(s) to ${target}/`)
    }
  } catch (error) {
    console.error('Error setting up test assets:', error)
    throw error
  }

  console.log('Global setup completed')
}

export default globalSetup
