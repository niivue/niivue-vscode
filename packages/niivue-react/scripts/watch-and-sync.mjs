#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '../dist');
const targetDir = join(__dirname, '../../../apps/vscode/niivue');

let lastModTime = 0;

function syncFiles() {
  if (existsSync(sourceDir)) {
    try {
      mkdirSync(targetDir, { recursive: true });
      cpSync(sourceDir, targetDir, { recursive: true });
      console.log('[Watch] ✓ Synced React dist to VS Code niivue/');
      return true;
    } catch (error) {
      console.error('[Watch] ✗ Error syncing files:', error.message);
      return false;
    }
  }
  return false;
}

function getModTime() {
  try {
    // Check the index.js file since it's the main bundle
    const indexPath = join(sourceDir, 'index.js')
    if (existsSync(indexPath)) {
      return statSync(indexPath).mtimeMs
    }
  } catch {
    // Ignore errors
  }
  return 0
}

// Initial sync
console.log('[Watch] Starting file sync watcher (polling mode for dev containers)...');
syncFiles();
lastModTime = getModTime();

// Poll for changes (required for dev containers since fs.watch doesn't work reliably)
setInterval(() => {
  const currentModTime = getModTime();
  if (currentModTime > lastModTime) {
    console.log(`[Watch] Detected change in dist/`);
    if (syncFiles()) {
      lastModTime = currentModTime;
    }
  }
}, 1000); // Check every second

console.log(`[Watch] Polling ${sourceDir} for changes every 1s...`);
