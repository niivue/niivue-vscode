import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'lib/**',
      'node_modules/**',
      'build/**',
      'dist/**',
      '**/*.js.map',
      '**/*.d.ts.map',
      'jupyterlab_niivue/labextension/**',
      'static/**',
      '.pnp.cjs',
      '.pnp.loader.mjs',
      'webpack.config.js'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      curly: 'error',
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error'
    }
  }
];
