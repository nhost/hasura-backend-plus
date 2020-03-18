/* eslint-disable */
const { compilerOptions } = require('./tsconfig')
const { register } = require('tsconfig-paths')

register({
  baseUrl: 'dist',
  paths: compilerOptions.paths
})
