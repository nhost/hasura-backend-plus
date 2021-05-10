module.exports = {
  globalSetup: '<rootDir>/src/test/global-setup.ts',
  verbose: true,
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/src/test/setup.ts'],
  // transform: {
  //   '^.+\\.ts?$': 'ts-jest'
  // }
  preset: 'ts-jest'
}
