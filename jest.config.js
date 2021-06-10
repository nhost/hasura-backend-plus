module.exports = {
  verbose: true,
  moduleNameMapper: {
    globalSetup: '<rootDir>/src/test/global-setup.ts',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/', '<rootDir>/data/'],
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/src/test/setup.ts'],
  // transform: {
  //   '^.+\\.ts?$': 'ts-jest'
  // }
  preset: 'ts-jest'
}
