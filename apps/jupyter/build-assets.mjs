import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd(), '..', '..');
const reactPkgDir = path.resolve(rootDir, 'packages', 'niivue-react');
const jupyterStaticDir = path.resolve(process.cwd(), 'static', 'niivue');

// 1. Build niivue-react with BUILD_TARGET=vscode
console.log('Building @niivue/react with BUILD_TARGET=vscode...');
execSync('pnpm build', {
  cwd: reactPkgDir,
  env: { ...process.env, BUILD_TARGET: 'vscode' },
  stdio: 'inherit',
});

// 2. Re-create jupyter static niivue directory
console.log('Cleaning and recreating static niivue directory...');
fs.rmSync(jupyterStaticDir, { recursive: true, force: true });
fs.mkdirSync(jupyterStaticDir, { recursive: true });

// 3. Copy files excluding: build, *.html, manifest.webmanifest, registerSW.js, sw.js, workbox-*.js
const srcDistDir = path.resolve(reactPkgDir, 'dist');
console.log(`Copying built files from ${srcDistDir} to ${jupyterStaticDir}...`);

const excludePatterns = [
  /^build$/,
  /\.html$/,
  /^manifest\.webmanifest$/,
  /^registerSW\.js$/,
  /^sw\.js$/,
  /^workbox-.*\.js$/,
];

function shouldExclude(fileName) {
  return excludePatterns.some((pattern) => pattern.test(fileName));
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  const baseName = path.basename(src);
  if (shouldExclude(baseName)) {
    return;
  }

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(srcDistDir, jupyterStaticDir);
console.log('Jupyter assets built and copied successfully.');
