module.exports = {
  testEnvironment: 'node',
  rootDir:         '.',                        // project root = backend/
  testMatch:       ['**/src/__tests__/**/*.test.js'],
  moduleDirectories: ['node_modules', 'src'],  // allows imports from src/
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/config/migrate.js',
    '!src/server.js',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
  clearMocks:   true,
  resetMocks:   true,
  restoreMocks: true,
  testTimeout:  15000,
  setupFiles:   ['<rootDir>/src/__tests__/setup.js'],
};
