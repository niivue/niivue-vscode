import fs from 'fs/promises'
import path from 'path'

const rootDir = path.resolve(process.cwd(), '..', '..')
const pwaPublicDir = path.resolve(process.cwd(), 'public')

const assetsToCopy = [
  {
    src: path.resolve(rootDir, 'packages', 'niivue-react', 'public', 'niivue_icon_transparent_contrast.png'),
    dest: path.resolve(pwaPublicDir, 'logo.png'),
  },
]

async function copyAssets() {
  try {
    await fs.mkdir(pwaPublicDir, { recursive: true })
    for (const asset of assetsToCopy) {
      await fs.copyFile(asset.src, asset.dest)
      console.log(`Copied ${path.basename(asset.src)} to ${pwaPublicDir}`)
    }
    console.log('Note: PWA icons are generated from logo.png using @vite-pwa/assets-generator')
  } catch (error) {
    console.error('Error copying assets:', error)
    process.exit(1)
  }
}

copyAssets()
