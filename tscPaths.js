import { compilerOptions } from './tsconfig.json'
import { register } from 'tsconfig-paths'

register({
  baseUrl: 'dist',
  paths: compilerOptions.paths
})
