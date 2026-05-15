import { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...')

  const testAssetsDir = path.resolve(__dirname, '..', 'test', 'assets')
  const pwaRoot = path.resolve(__dirname, '..')

  try {
    const testFiles = await fs.readdir(testAssetsDir)
    for (const target of ['public', 'build']) {
      const targetDir = path.join(pwaRoot, target)
      for (const file of testFiles) {
        try {
          await fs.unlink(path.join(targetDir, file))
        } catch { /* may not exist; fine */ }
      }
    }
    try { await fs.rmdir(path.join(pwaRoot, 'public')) } catch { /* not empty / missing */ }
  } catch (error) {
    console.error('Error cleaning up test assets:', error)
  }

  console.log('Global teardown completed')
}

export default globalTeardown
