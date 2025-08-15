module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false,
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json', 'jsx'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
}