import { castBooleanEnv, castIntEnv } from './utils'

/**
 * * Storage Settings
 */
export const STORAGE_ENABLE = castBooleanEnv('STORAGE_ENABLE', true)
export const S3_SSL_ENABLED = castBooleanEnv('S3_SSL_ENABLED', true)

// Default Presigned URL expiries to 24 hours
export const S3_PRESIGNED_URL_EXPIRES_DEFAULT = castIntEnv(
  'S3_PRESIGNED_URL_EXPIRES_DEFAULT',
  60 * 60 * 24
)

export const { S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
