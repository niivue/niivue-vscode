import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    preact(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NiivueReact',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['preact', 'preact/hooks'],
      output: {
        globals: {
          preact: 'preact',
          'preact/hooks': 'preactHooks'
        }
      }
    },
    sourcemap: true
  },
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
