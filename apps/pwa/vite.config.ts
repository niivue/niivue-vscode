import preact from '@preact/preset-vite'
import path, { resolve } from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import virtual from 'vite-plugin-virtual'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['@niivue/niivue', '@preact/signals', 'preact'],
    exclude: ['@niivue/dicom-loader', '@niivue/react'], // Exclude local package from pre-bundling
  },
  resolve: {
    alias: {
      // Point directly to source files for hot reload
      '@niivue/react': resolve(__dirname, '../../packages/niivue-react/src'),
    },
    // react-router-dom specifies "module" field in package.json for ESM entry
    // if it's not mapped, it uses the "main" field which is CommonJS that redirects to CJS preact
    mainFields: ['module'],
  },
  server: {
    host: '0.0.0.0', // Allow connections from any host
    port: 4000,
    open: false,
    cors: true,
    watch: {
      // Watch for changes in the React package
      ignored: ['!../../packages/niivue-react/src/**'],
      usePolling: true, // Use polling for better cross-platform compatibility
      interval: 100, // Check every 100ms
    },
    fs: {
      // Allow serving files from the monorepo
      allow: ['../..'],
    },
  },
  plugins: [
    preact(),
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
            console.warn('Failed to create self-contained worker, using fallback:', error);
          }
        }
        
        // Simple fallback that doesn't use problematic worker syntax
        return `
          console.warn('dcm2niix worker not available in this build');
          export default null;
        `;
      })()
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', '*.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/niivue\.github\.io\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'NiiVue Medical Image Viewer',
        short_name: 'NiiVue',
        description: 'Advanced web-based medical image viewer for NIfTI and DICOM files',
        start_url: '/niivue-vscode/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        orientation: 'any',
        categories: ['medical', 'productivity', 'utilities'],
        icons: [
          {
            src: 'niivue_icon_transparent_contrast.png',
            sizes: '200x200',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'niivue_icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Open Example Image',
            short_name: 'Example',
            description: 'Load MNI152 example image',
            url: '/niivue-vscode/?example=mni152',
            icons: [{ src: 'niivue_icon_transparent_contrast.png', sizes: '200x200' }],
          },
        ],
        file_handlers: [
          {
            action: '/niivue-vscode/',
            accept: {
              'image/*': [
                '.nii',
                '.nii.gz',
                '.dcm',
                '.mha',
                '.mhd',
                '.nhdr',
                '.nrrd',
                '.mgh',
                '.mgz',
                '.v',
                '.v16',
                '.vmr',
                '.gii',
                '.mz3',
              ],
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'build',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase threshold for medical imaging libs that include compression algorithms
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['preact', '@preact/signals'],
        },
      },
      // Ensure virtual modules are properly handled
      onwarn: (warning, warn) => {
        // Suppress warnings about virtual modules
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('dcm2niix-worker')) {
          return;
        }
        warn(warning);
      },
    },
    target: 'esnext',
    minify: 'terser',
  },
  base: '/niivue-vscode/', // this is the path for the github pages
})
