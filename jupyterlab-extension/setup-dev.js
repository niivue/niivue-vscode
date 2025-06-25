#!/usr/bin/env node
/**
 * Simple development setup for JupyterLab extension
 * This script helps set up the development environment step by step
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, options = {}) {
  console.log(`Running: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  console.log('🚀 Setting up NiiVue JupyterLab Extension Development Environment\n');

  // Check prerequisites
  console.log('1. Checking prerequisites...');
  
  if (!checkCommand('node')) {
    console.error('❌ Node.js is not installed. Please install Node.js first.');
    process.exit(1);
  }
  console.log('✅ Node.js is available');

  if (!checkCommand('npm')) {
    console.error('❌ npm is not installed. Please install npm first.');
    process.exit(1);
  }
  console.log('✅ npm is available');

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found. Please run this from the jupyterlab-extension directory.');
    process.exit(1);
  }

  // Install dependencies
  console.log('\n2. Installing Node.js dependencies...');
  runCommand('npm install');

  // Build TypeScript
  console.log('\n3. Building TypeScript...');
  const buildResult = runCommand('npm run build:lib');
  
  if (buildResult === null) {
    console.log('\n⚠️  TypeScript build had errors, but that\'s expected during development.');
    console.log('The extension structure is set up and ready for development.');
  } else {
    console.log('✅ TypeScript build successful');
  }

  // Check for JupyterLab
  console.log('\n4. Checking for JupyterLab...');
  if (checkCommand('jupyter')) {
    console.log('✅ JupyterLab/Jupyter is available');
    console.log('\nTo complete the setup with JupyterLab integration:');
    console.log('  jupyter labextension develop . --overwrite');
  } else {
    console.log('⚠️  JupyterLab not found. Install it with:');
    console.log('  pip install jupyterlab');
    console.log('  Then run: jupyter labextension develop . --overwrite');
  }

  console.log('\n🎉 Development environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Fix any TypeScript errors in the src/ files');
  console.log('2. Run "npm run watch" to start development mode');
  console.log('3. Install JupyterLab if not already installed');
  console.log('4. Run "jupyter lab" to test the extension');
}

if (require.main === module) {
  main();
}
