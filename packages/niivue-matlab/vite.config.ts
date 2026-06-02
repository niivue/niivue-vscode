import preact from '@preact/preset-vite'
import fs from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import virtual from 'vite-plugin-virtual'

// Inline the dcm2niix worker (with WASM) into a single virtual module.
// Same pattern as apps/pwa/vite.config.ts and apps/streamlit/.../vite.config.ts:
// @niivue/react monkey-patches Dcm2niix.prototype.init at module load to use
// this URL instead of `new Worker(new URL('./worker.js', import.meta.url))`,
// which avoids emitting a sibling worker chunk. MATLAB's uihtml only serves
// a single HTML file, so any sibling chunk would be unreachable at runtime.
function buildInlineDcm2niixWorker(): string {
  const workerPath = path.resolve(__dirname, 'node_modules/@niivue/dcm2niix/dist/worker.js')
  const dcm2niixPath = path.resolve(path.dirname(workerPath), 'dcm2niix.js')
  const wasmPath = path.resolve(path.dirname(workerPath), 'dcm2niix.wasm')

  if (!fs.existsSync(workerPath) || !fs.existsSync(dcm2niixPath) || !fs.existsSync(wasmPath)) {
    return `console.warn('dcm2niix worker not available in this build');\nexport default null;`
  }

  const workerContent = fs.readFileSync(workerPath, 'utf8')
  const dcm2niixContent = fs.readFileSync(dcm2niixPath, 'utf8')
  const wasmBase64 = fs.readFileSync(wasmPath).toString('base64')

  // String replacement matches the exact emitted form from dcm2niix's build.
  // If dcm2niix changes its output, this needs updating (same fragility as
  // the pwa/streamlit copies).
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
}

export default defineConfig({
  plugins: [
    preact(),
    virtual({
      'dcm2niix-worker': buildInlineDcm2niixWorker(),
    }),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
    }),
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // Inline all assets
    cssCodeSplit: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Alias @niivue/react to its source so the matlab build does not
      // depend on the niivue-react package being pre-built. Same pattern
      // as apps/pwa/vite.config.ts. Without this, turbo's parallel
      // scheduler can dispatch matlab's build before niivue-react's
      // `dist/index.js` is on disk, and vite's commonjs--resolver fails
      // with "Failed to resolve entry for package '@niivue/react'".
      '@niivue/react': resolve(__dirname, '../niivue-react/src'),
      // Stub @niivue/dcm2niix so vite's static analysis never sees the
      // `new Worker(new URL('./worker.js', import.meta.url))` call in the
      // real package and therefore does not emit a sibling worker chunk
      // (lossless or JPEG-LS). niivue-react monkey-patches Dcm2niix
      // .prototype.init at module load to spawn from the inlined
      // `dcm2niix-worker` virtual module, so the inlined worker is what
      // actually runs. MATLAB users send NIfTI bytes through the bridge
      // and never invoke the DICOM-conversion path.
      '@niivue/dcm2niix': path.resolve(__dirname, 'src/stubs/dcm2niix-stub.js'),
    },
  },
})
