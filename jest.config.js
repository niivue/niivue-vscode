/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  testPathIgnorePatterns: [
    '/dist/', '/out/', '/node_modules/'
  ]
};