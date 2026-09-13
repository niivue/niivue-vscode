import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import virtual from 'vite-plugin-virtual'
import { dcm2niixWorkerModule } from '../../packages/niivue-react/vite/dcm2niix-worker'

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
    // Tauri uses Chromium on Windows/Linux and WebKit on macOS.
    // safari15 is the floor: Vite 8's worker bundler (esbuild) cannot lower
    // the inlined dcm2niix worker to safari14, and macOS 12+ ships Safari 15+.
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Rolldown (Vite 8) requires manualChunks to be a function, not an object
        manualChunks: (id) => {
          if (id.includes('/preact/') || id.includes('/@preact/signals')) {
            return 'vendor'
          }
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
