import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import virtual from 'vite-plugin-virtual'
import { dcm2niixWorkerModule } from '../../../../packages/niivue-react/vite/dcm2niix-worker'

export default defineConfig({
  plugins: [
    preact(),
    virtual({
      'dcm2niix-worker': dcm2niixWorkerModule(),
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
