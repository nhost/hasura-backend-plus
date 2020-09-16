module.exports = {
  globalSetup: './src/test/jest-global-setup.ts',
  verbose: true,
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['jest-extended'],
  // transform: {
  //   '^.+\\.ts?$': 'ts-jest'
  // }
  preset: 'ts-jest'
}
