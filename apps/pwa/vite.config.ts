import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
    port: 4000,
    open: true,
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
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['preact', '@preact/signals'],
        },
      },
    },
    target: 'esnext',
    minify: 'terser',
  },
  base: '/niivue-vscode/', // this is the path for the github pages
})
