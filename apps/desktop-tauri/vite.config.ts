import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  optimizeDeps: {
    include: ['@niivue/niivue', '@preact/signals', 'preact'],
    exclude: ['@niivue/react'],
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
  plugins: [preact()],
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
    },
  },
  // Tauri expects a fixed port; fail if that port is not available
  envPrefix: ['VITE_', 'TAURI_'],
})
