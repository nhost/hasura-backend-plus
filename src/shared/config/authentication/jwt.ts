import path from 'path'
import { castIntEnv, castStringArrayEnv } from '../utils'

/**
 * * Authentication settings
 */
export const {
  JWT_KEY,
  JWT_ALGORITHM = 'RS256',
  JWT_CLAIMS_NAMESPACE = 'https://hasura.io/jwt/claims'
} = process.env
export const JWT_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')
export const JWT_EXPIRES_IN = castIntEnv('JWT_EXPIRES_IN', 15)
export const JWT_REFRESH_EXPIRES_IN = castIntEnv('JWT_REFRESH_EXPIRES_IN', 43200)
export const JWT_CUSTOM_FIELDS = castStringArrayEnv('JWT_CUSTOM_FIELDS')
