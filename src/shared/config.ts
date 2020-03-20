import 'dotenv/config'
import path from 'path'
import Boom from '@hapi/boom'

/**
 * Destructuring environment variables.
 */
export const {
  HASURA_GRAPHQL_ENDPOINT,
  HASURA_GRAPHQL_ADMIN_SECRET,
  SERVER_PORT = 3000,
  COOKIE_SECRET,
  JWT_ALGORITHM = 'RS256',
  JWT_SECRET_KEY,
  ALLOWED_EMAIL_DOMAINS,
  DEFAULT_USER_ROLE = 'user',
  OTP_ISSUER = 'HBP',
  MAX_REQUESTS = 100,
  TIME_FRAME = 15 * 60 * 1000,
  AUTO_ACTIVATE = false,
  HIBP_ENABLED = false,
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT
} = process.env

export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN as string, 10) || 43200
export const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15
export const KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')

if (!HASURA_GRAPHQL_ENDPOINT) throw Boom.badImplementation('No Hasura Graphql enpoint found.')
