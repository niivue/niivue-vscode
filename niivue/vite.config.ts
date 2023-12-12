import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 4000 },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: { maximumFileSizeToCacheInBytes: 3000000 },
      manifest: {
        name: 'niivue-vscode web app',
        short_name: 'niivue',
        description: 'Web App for viewing medical images (NIfTI)',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'niivue_icon.png',
            sizes: '200x200',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    // react-router-dom specifies "module" field in package.json for ESM entry
    // if it's not mapped, it uses the "main" field which is CommonJS that redirects to CJS preact
    mainFields: ['module'],
  },
  base: '/niivue/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
  },
})
