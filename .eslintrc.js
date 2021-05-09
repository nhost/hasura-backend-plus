module.exports = {
  root: true,
  rules: {
    '@typescript-eslint/camelcase': 'off',
    'jest/expect-expect': 'off',
    'jest/no-test-callback': 'off'
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'jest'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:jest/recommended'
  ]
}
