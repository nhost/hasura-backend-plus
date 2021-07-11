import { castBooleanEnv, envExists } from './utils'

/**
 * * Storage Settings
 */
export const STORAGE = {
  get ENABLED() {
    if (envExists('STORAGE_ENABLED')) {
      return castBooleanEnv('STORAGE_ENABLED')
    }

    if (envExists('STORAGE_ENABLE')) {
      return castBooleanEnv('STORAGE_ENABLE')
    }

    return true
  },
  get S3_SSL_ENABLED() {
    if (envExists('S3_SSL_ENABLED')) {
      return castBooleanEnv('S3_SSL_ENABLED')
    }

    if (envExists('S3_SSL_ENABLE')) {
      return castBooleanEnv('S3_SSL_ENABLE')
    }

    return true
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
