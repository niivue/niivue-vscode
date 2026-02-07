import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalSetup(config: FullConfig) {
  // Global setup logic here
  console.log('Starting global setup...')

  // Copy test assets to public directory so the dev server can serve them
  const testAssetsDir = path.resolve(__dirname, '..', 'test', 'assets')
  const publicDir = path.resolve(__dirname, '..', 'public')

  try {
    // Create public directory if it doesn't exist
    await fs.mkdir(publicDir, { recursive: true })

    // Copy all test assets to public directory
    const files = await fs.readdir(testAssetsDir)
    for (const file of files) {
      const srcPath = path.join(testAssetsDir, file)
      const destPath = path.join(publicDir, file)
      await fs.copyFile(srcPath, destPath)
      console.log(`Copied ${file} to public directory`)
    }
  } catch (error) {
    console.error('Error setting up test assets:', error)
    throw error
  }

  console.log('Global setup completed')
}

export default globalSetup
