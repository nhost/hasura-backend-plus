import { castBooleanEnv } from './utils'

/**
 * * Storage Settings
 */
export const STORAGE = {
  get STORAGE_ENABLE() {
    return castBooleanEnv('STORAGE_ENABLE', true)
  },
  get S3_SSL_ENABLED() {
    return castBooleanEnv('S3_SSL_ENABLED', true)
  },
  get S3_BUCKET() {
    return process.env.S3_BUCKET || ''
  },
  get S3_ENDPOINT() {
    return process.env.S3_ENDPOINT || ''
  },
  get S3_ACCESS_KEY_ID() {
    return process.env.S3_ACCESS_KEY_ID || ''
  },
  get S3_SECRET_ACCESS_KEY() {
    return process.env.S3_SECRET_ACCESS_KEY || ''
  },
}