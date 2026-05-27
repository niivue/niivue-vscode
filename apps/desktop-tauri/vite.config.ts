import preact from '@preact/preset-vite'
import fs from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import virtual from 'vite-plugin-virtual'

/**
 * Provide the `dcm2niix-worker` virtual module that `@niivue/react`
 * imports. Same approach as the PWA: inline the worker script and its WASM
 * payload at build time so we ship a single self-contained Blob URL with no
 * runtime fetch. Falls back to a stubbed null export if the upstream files
 * are missing (e.g. during a partial install), matching the PWA's behaviour.
 */
function dcm2niixWorkerModule(): string {
  const workerPath = path.resolve(
    __dirname,
    'node_modules/@niivue/dcm2niix/dist/worker.js',
  )
  const dcm2niixPath = path.resolve(path.dirname(workerPath), 'dcm2niix.js')
  const wasmPath = path.resolve(path.dirname(workerPath), 'dcm2niix.wasm')

  if (
    fs.existsSync(workerPath) &&
    fs.existsSync(dcm2niixPath) &&
    fs.existsSync(wasmPath)
  ) {
    try {
      const workerContent = fs.readFileSync(workerPath, 'utf8')
      const dcm2niixContent = fs.readFileSync(dcm2niixPath, 'utf8')
      const wasmBase64 = fs.readFileSync(wasmPath).toString('base64')

      const modifiedDcm2niix = dcm2niixContent.replace(
        'function findWasmBinary(){if(Module["locateFile"]){var f="dcm2niix.wasm";if(!isDataURI(f)){return locateFile(f)}return f}return new URL("dcm2niix.wasm",import.meta.url).href}',
        `function findWasmBinary(){return "data:application/wasm;base64,${wasmBase64}"}`,
      )

      const selfContainedWorker = workerContent.replace(
        `import Module from './dcm2niix.js';`,
        `// Inlined dcm2niix module\n${modifiedDcm2niix}\n// Use the inlined Module`,
      )

      return `
        const workerCode = ${JSON.stringify(selfContainedWorker)};
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        export default URL.createObjectURL(blob);
      `
    } catch (error) {
      console.warn('Failed to create self-contained dcm2niix worker, using fallback:', error)
    }
  }

  return `
    console.warn('dcm2niix worker not available in this build');
    export default null;
  `
}

export default defineConfig({
  clearScreen: false,
  optimizeDeps: {
    include: ['@niivue/niivue', '@preact/signals', 'preact'],
    exclude: ['@niivue/dicom-loader', '@niivue/react'],
  },
  resolve: {
    alias: {
      // Point directly to source files for hot reload during development
      '@niivue/react': resolve(__dirname, '../../packages/niivue-react/src'),
    },
    mainFields: ['module'],
  },
  server: {
    port: 4001,
    strictPort: true,
    watch: {
      ignored: ['!../../packages/niivue-react/src/**'],
    },
    fs: {
      allow: ['../..'],
    },
  },
  plugins: [
    preact(),
    virtual({
      'dcm2niix-worker': dcm2niixWorkerModule(),
    }),
  ],
  build: {
    outDir: 'build',
    sourcemap: true,
    // Tauri uses Chromium on Windows/Linux and WebKit on macOS
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari14',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['preact', '@preact/signals'],
        },
      },
      onwarn: (warning, warn) => {
        // Suppress warnings about virtual modules
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.message?.includes('dcm2niix-worker')
        ) {
          return
        }
        warn(warning)
      },
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
})
