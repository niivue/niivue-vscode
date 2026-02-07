import { FullConfig } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...')

  // Clean up test assets from public directory
  const testAssetsDir = path.resolve(__dirname, '..', 'test', 'assets')
  const publicDir = path.resolve(__dirname, '..', 'public')

  try {
    // Get list of test asset files
    const testFiles = await fs.readdir(testAssetsDir)
    
    // Remove only the specific test files we copied
    for (const file of testFiles) {
      const filePath = path.join(publicDir, file)
      try {
        await fs.unlink(filePath)
        console.log(`Removed ${file} from public directory`)
      } catch (error) {
        // File might not exist, ignore
      }
    }
    
    // Try to remove the public directory if it's empty
    try {
      await fs.rmdir(publicDir)
      console.log('Removed empty public directory')
    } catch (error) {
      // Directory might not be empty or might not exist, that's fine
    }
  } catch (error) {
    console.error('Error cleaning up test assets:', error)
    // Don't throw - teardown errors shouldn't fail the test suite
  }

  console.log('Global teardown completed')
}

export default globalTeardown
