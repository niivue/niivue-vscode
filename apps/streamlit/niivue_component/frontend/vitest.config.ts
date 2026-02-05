import preact from '@preact/preset-vite'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    mainFields: ['module'],
    alias: {
      '@niivue/react': resolve(__dirname, '../../../../packages/niivue-react/dist/index.js'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**', 'build/**', 'dist/**'],
  },
})
