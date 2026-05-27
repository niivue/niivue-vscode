import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd(), '..', '..');
const reactPkgDir = path.resolve(rootDir, 'packages', 'niivue-react');
const vscodeNiivueDir = path.resolve(process.cwd(), 'niivue');

// 1. Clean existing niivue dir
console.log('Cleaning existing niivue directory...');
fs.rmSync(vscodeNiivueDir, { recursive: true, force: true });

// 2. Build niivue-react with BUILD_TARGET=vscode
console.log('Building @niivue/react with BUILD_TARGET=vscode...');
execSync('pnpm build', {
  cwd: reactPkgDir,
  env: { ...process.env, BUILD_TARGET: 'vscode' },
  stdio: 'inherit',
});

// 3. Create niivue dir
fs.mkdirSync(vscodeNiivueDir, { recursive: true });

// 4. Copy dist files to niivue dir
const srcDistDir = path.resolve(reactPkgDir, 'dist');
console.log(`Copying built files from ${srcDistDir} to ${vscodeNiivueDir}...`);

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(srcDistDir, vscodeNiivueDir);
console.log('Webview built and assets copied successfully.');
