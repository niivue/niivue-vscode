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
  // public/ for vite dev server; build/ for vite preview. The build runs as a
  // separate step (`test:e2e:build`) before Playwright so the two e2e lanes can
  // share one build; the webServer only runs `vite preview`. By the time this
  // setup runs, build/ already exists — we just drop the test images into it so
  // vite preview can serve them.
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
      let copied = 0
      for (const file of files) {
        const src = path.join(testAssetsDir, file)
        const stat = await fs.stat(src)
        // Skip subdirectories (e.g. JupyterLab's .ipynb_checkpoints) — only
        // copy regular files to the served test-fixture directories.
        if (!stat.isFile()) continue
        await fs.copyFile(src, path.join(targetDir, file))
        copied++
      }
      console.log(`Copied ${copied} test asset(s) to ${target}/`)
    }
  } catch (error) {
    console.error('Error setting up test assets:', error)
    throw error
  }

  console.log('Global setup completed')
}

export default globalSetup
