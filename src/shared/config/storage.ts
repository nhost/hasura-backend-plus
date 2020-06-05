import { castBooleanEnv } from './utils'

/**
 * * Storage Settings
 */
export const STORAGE_ENABLE = castBooleanEnv('STORAGE_ENABLE', true)
export const S3_SSL_ENABLED = castBooleanEnv('S3_SSL_ENABLED', true)
export const { S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
