/* eslint-disable */
const { compilerOptions } = require('./tsconfig.json')
const { register } = require('tsconfig-paths')

register({
  baseUrl: 'dist',
  paths: compilerOptions.paths
})
