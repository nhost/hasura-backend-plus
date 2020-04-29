module.exports = {
  globalSetup: './src/test/setup.ts',
  globalTeardown: './src/test/teardown.ts',
  testEnvironment: './src/test/puppeteer_environment.js',
  verbose: true,
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['expect-puppeteer', 'jest-extended'],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
}
