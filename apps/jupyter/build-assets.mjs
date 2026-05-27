import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const rootDir = path.resolve(process.cwd(), '..', '..')
const reactPkgDir = path.resolve(rootDir, 'packages', 'niivue-react')
const jupyterStaticDir = path.resolve(process.cwd(), 'static', 'niivue')

// 1. Build niivue-react with BUILD_TARGET=vscode
console.log('Building @niivue/react with BUILD_TARGET=vscode...')
execSync('pnpm build', {
  cwd: reactPkgDir,
  env: { ...process.env, BUILD_TARGET: 'vscode' },
  stdio: 'inherit',
})

// 2. Re-create jupyter static niivue directory
console.log('Cleaning and recreating static niivue directory...')
fs.rmSync(jupyterStaticDir, { recursive: true, force: true })
fs.mkdirSync(jupyterStaticDir, { recursive: true })

// 3. Copy files from dist excluding PWA artifacts (build/, *.html, manifest.webmanifest, registerSW.js, sw.js, workbox-*.js)
const srcDistDir = path.resolve(reactPkgDir, 'dist')
console.log(`Copying built files from ${srcDistDir} to ${jupyterStaticDir}...`)

const excludePatterns = [
  /^build$/,
  /\.html$/,
  /^manifest\.webmanifest$/,
  /^registerSW\.js$/,
  /^sw\.js$/,
  /^workbox-.*\.js$/,
]

fs.cpSync(srcDistDir, jupyterStaticDir, {
  recursive: true,
  filter: (src) => !excludePatterns.some((pattern) => pattern.test(path.basename(src))),
})

console.log('Jupyter assets built and copied successfully.')
