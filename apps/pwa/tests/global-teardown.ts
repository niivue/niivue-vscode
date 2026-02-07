import { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...')

  // Clean up test assets from public directory
  const publicDir = path.resolve(__dirname, '..', 'public')

  try {
    // Remove the public directory (it was only for tests)
    await fs.rm(publicDir, { recursive: true, force: true })
    console.log('Cleaned up public directory')
  } catch (error) {
    console.error('Error cleaning up test assets:', error)
    // Don't throw - teardown errors shouldn't fail the test suite
  }

  console.log('Global teardown completed')
}

export default globalTeardown
