import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 4000 },
  plugins: [
    preact(),
    VitePWA({
      includeAssets: ['favicon.ico'],
      workbox: { maximumFileSizeToCacheInBytes: 3000000 },
      manifest: {
        name: 'niivue-vscode web app',
        short_name: 'niivue',
        description: 'Web App for viewing medical images (NIfTI)',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'niivue_icon_transparent.png',
            sizes: '200x200',
            type: 'image/png',
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
  base: '/niivue-vscode/', // this is the path for the github pages
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
    testMatch: ['niivue/src/**/*.test.ts'],
    exclude: ['node_modules/**', '**/*.spec.ts'],
  },
})
