/// <reference types="vitest" />
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import virtual from 'vite-plugin-virtual'
import { dcm2niixWorkerModule } from './vite/dcm2niix-worker'

// Standalone app bundles for embedding hosts (VS Code webview, Jupyter widget).
// Each gets its own outDir so it never overwrites the library build in dist/.
const APP_TARGETS = ['vscode', 'jupyter']
const appTarget = APP_TARGETS.includes(process.env.BUILD_TARGET ?? '')
  ? process.env.BUILD_TARGET
  : null

export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Allow connections from any host
    port: 4000,
    open: false,
    cors: true,
    fs: {
      // Allow serving files from the monorepo
      allow: ['../..'],
    },
    // Enable polling for dev containers and remote file systems
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  plugins: [
    preact(),
    // Only generate .d.ts files for the library build (skip in development mode for speed)
    ...(mode === 'development' || appTarget
      ? []
      : [
        dts({
          insertTypesEntry: true,
          copyDtsFiles: true,
        }),
      ]),
    virtual({
      'dcm2niix-worker': dcm2niixWorkerModule(),
    }),
  ],
  build: {
    outDir: appTarget ? `dist-${appTarget}` : 'dist',
    // Only enable watch mode in development
    watch: mode === 'development' ? {
      // Rollup watch options with polling for dev containers
      chokidar: {
        usePolling: true,
        interval: 1000,
      },
    } : null,
    lib: {
      entry: appTarget
        ? resolve(__dirname, 'src/main.tsx')
        : resolve(__dirname, 'src/index.ts'),
      name: 'NiivueReact',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: appTarget
        ? [] // Bundle all dependencies into the standalone app
        : ['preact', 'preact/hooks', '@niivue/niivue', '@niivue/dicom-loader', '@preact/signals'],
      output: {
        globals: {
          preact: 'preact',
          'preact/hooks': 'preactHooks',
        },
      },
    },
    // Optimize for faster development builds
    minify: mode === 'development' ? false : 'esbuild',
    sourcemap: true,
    // Use esbuild for faster transpilation
    target: 'esnext',
  },
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'build/**', 'dist/**'],
  },
}))
