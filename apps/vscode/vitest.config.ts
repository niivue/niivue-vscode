import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
  resolve: {
    alias: {
      vscode: path.resolve(dir, 'test/vscode-mock.ts'),
    },
  },
})
