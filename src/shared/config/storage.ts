import { returnBooleanEnvVar } from './utils'

/**
 * * Storage Settings
 */
export const STORAGE = {
  get ENABLED() {
    return returnBooleanEnvVar(['STORAGE_ENABLE', 'STORAGE_ENABLED'], true)
  },
  get S3_SSL_ENABLED() {
    return returnBooleanEnvVar(['S3_SSL_ENABLE', 'S3_SSL_ENABLED'], true)
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
  }
}
