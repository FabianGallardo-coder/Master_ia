module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/__tests__/helpers/jestGlobals.mjs'],
  testMatch: ['**/__tests__/**/*.test.mjs', '**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['mjs', 'js', 'jsx', 'ts', 'tsx'],
  transform: {},
  collectCoverageFrom: [
    'app.mjs',
    'electron.cjs',
    'server.cjs',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!**/.*'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true
};