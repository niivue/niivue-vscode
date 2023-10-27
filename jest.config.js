/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: { "^.+\\.tsx?$": "babel-jest" },
};