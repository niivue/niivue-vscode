import preact from '@preact/preset-vite'
import fs from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import virtual from 'vite-plugin-virtual'

export default defineConfig({
  plugins: [
    preact(),
    virtual({
      'dcm2niix-worker': (() => {
        const workerPath = path.resolve(
          __dirname,
          '../../../../node_modules/@niivue/dcm2niix/dist/worker.js',
        )
        const dcm2niixPath = path.resolve(path.dirname(workerPath), 'dcm2niix.js')
        const wasmPath = path.resolve(path.dirname(workerPath), 'dcm2niix.wasm')

        // Check if all required files exist
        if (fs.existsSync(workerPath) && fs.existsSync(dcm2niixPath) && fs.existsSync(wasmPath)) {
          try {
            // Read all required files
            const workerContent = fs.readFileSync(workerPath, 'utf8')
            const dcm2niixContent = fs.readFileSync(dcm2niixPath, 'utf8')
            const wasmContent = fs.readFileSync(wasmPath)
            const wasmBase64 = wasmContent.toString('base64')

            // Create a modified dcm2niix module that uses inline WASM
            // WORKAROUND: This approach uses string replacement on the dcm2niix module.
            // It relies on exact matching of the function string. If dcm2niix updates
            // change the output, this may need to be updated. Consider this a temporary
            // solution until a more robust plugin-based approach can be implemented.
            const modifiedDcm2niix = dcm2niixContent.replace(
              'function findWasmBinary(){if(Module["locateFile"]){var f="dcm2niix.wasm";if(!isDataURI(f)){return locateFile(f)}return f}return new URL("dcm2niix.wasm",import.meta.url).href}',
              `function findWasmBinary(){return "data:application/wasm;base64,${wasmBase64}"}`,
            )

            // Create self-contained worker with inlined dependencies
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
            console.warn('Failed to create self-contained worker, using fallback:', error)
          }
        }

        // Simple fallback that doesn't use problematic worker syntax
        return `
          console.warn('dcm2niix worker not available in this build');
          export default null;
        `
      })(),
    }),
  ],
  optimizeDeps: {
    include: ['@niivue/niivue', '@preact/signals', 'preact', 'streamlit-component-lib'],
  },
  resolve: {
    alias: {
      '@niivue/react': resolve(__dirname, '../../../../packages/niivue-react/src'),
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    cors: true,
    fs: {
      allow: ['../../../..'],
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    target: 'esnext',
    minify: 'terser',
  },
  base: './',
})
