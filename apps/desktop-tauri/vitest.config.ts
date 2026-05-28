import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      // Match vite.config.ts so tests resolve the workspace source directly
      // instead of the built dist. Without this, a parallel `turbo build`
      // that rebuilds @niivue/react can transiently break the resolver.
      '@niivue/react': resolve(__dirname, '../../packages/niivue-react/src'),
    },
    mainFields: ['module'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**', 'build/**', 'src-tauri/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: './coverage/unit',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx', 'src/types/**'],
    },
  },
})
