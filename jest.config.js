module.exports = {
  globalSetup: './jest/setup.js',
  globalTeardown: './jest/teardown.js',
  testEnvironment: './jest/puppeteer_environment.js',
  verbose: true,
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['expect-puppeteer', 'jest-extended'],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
}
