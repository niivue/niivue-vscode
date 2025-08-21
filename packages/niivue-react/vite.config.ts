/// <reference types="vitest" />
import preact from '@preact/preset-vite'
import fs from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import virtual from 'vite-plugin-virtual'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow connections from any host
    port: 4000,
    open: false,
    cors: true,
    fs: {
      // Allow serving files from the monorepo
      allow: ['../..'],
    },
  },
  plugins: [
    preact(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
    }),
    virtual({
      'dcm2niix-worker': (() => {
        const workerPath = path.resolve(__dirname, 'node_modules/@niivue/dcm2niix/dist/worker.js');
        const dcm2niixPath = path.resolve(path.dirname(workerPath), 'dcm2niix.js');
        const wasmPath = path.resolve(path.dirname(workerPath), 'dcm2niix.wasm');
        
        // Check if all required files exist
        if (fs.existsSync(workerPath) && fs.existsSync(dcm2niixPath) && fs.existsSync(wasmPath)) {
          try {
            // Read all required files
            const workerContent = fs.readFileSync(workerPath, 'utf8');
            const dcm2niixContent = fs.readFileSync(dcm2niixPath, 'utf8');
            const wasmContent = fs.readFileSync(wasmPath);
            const wasmBase64 = wasmContent.toString('base64');
            
            // Create a modified dcm2niix module that uses inline WASM
            const modifiedDcm2niix = dcm2niixContent.replace(
              'function findWasmBinary(){if(Module["locateFile"]){var f="dcm2niix.wasm";if(!isDataURI(f)){return locateFile(f)}return f}return new URL("dcm2niix.wasm",import.meta.url).href}',
              `function findWasmBinary(){return "data:application/wasm;base64,${wasmBase64}"}`
            );
            
            // Create self-contained worker with inlined dependencies
            const selfContainedWorker = workerContent.replace(
              `import Module from './dcm2niix.js';`,
              `// Inlined dcm2niix module\n${modifiedDcm2niix}\n// Use the inlined Module`
            );
            
            return `
              const workerCode = ${JSON.stringify(selfContainedWorker)};
              const blob = new Blob([workerCode], { type: 'application/javascript' });
              export default URL.createObjectURL(blob);
            `;
          } catch (error) {
            console.error('Failed to create self-contained worker:', error);
          }
        }
        
        // Fallback to Vite's worker import
        return `import workerUrl from '${workerPath.replace(/\\/g, '/')}?worker&url'; export default workerUrl;`;
      })()
    })
  ],
    build: {
      lib: {
        entry: process.env.BUILD_TARGET === 'vscode'
          ? resolve(__dirname, 'src/main.tsx')
          : resolve(__dirname, 'src/index.ts'),
        name: 'NiivueReact',
        formats: ['es'],
        fileName: 'index'
      },
      rollupOptions: {
        external: process.env.BUILD_TARGET === 'vscode'
          ? [] // Bundle all dependencies for VS Code
          : ['preact', 'preact/hooks', '@niivue/niivue', '@niivue/dicom-loader', '@preact/signals'],
        output: {
          globals: {
            preact: 'preact',
            'preact/hooks': 'preactHooks'
          }
        }
      },
      sourcemap: true,
    },
    base: './',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      css: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'build/**',
        'dist/**',
      ],
  },
})
