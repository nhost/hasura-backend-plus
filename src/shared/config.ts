import 'dotenv/config'

import Boom from '@hapi/boom'
import path from 'path'

/**
 * Destructuring environment variables.
 */
export const {
  /**
   * App settings.
   */
  SERVER_URL,
  SERVER_PORT = 3000,
  REDIRECT_URL_ERROR,
  REDIRECT_URL_SUCCESS,

  /**
   * Hasura settings.
   */
  HASURA_GRAPHQL_ENDPOINT,
  HASURA_GRAPHQL_ADMIN_SECRET,

  /**
   * Authentication settings.
   */
  COOKIE_SECRET,
  JWT_SECRET_KEY,
  OTP_ISSUER = 'HBP',
  HIBP_ENABLED = false,
  ALLOWED_EMAIL_DOMAINS,
  AUTO_ACTIVATE = false,
  JWT_ALGORITHM = 'RS256',
  DEFAULT_USER_ROLE = 'user',

  /**
   * Rate limiter.
   */
  MAX_REQUESTS = 100,
  TIME_FRAME = 15 * 60 * 1000,

  /**
   * S3 settings.
   */
  S3_BUCKET,
  S3_ENDPOINT,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,

  /**
   * SMTP settings.
   */
  SMTP_PASS,
  SMTP_HOST,
  SMTP_USER,
  SMTP_ENABLED,
  SMTP_PORT = 587,
  SMTP_SECURE = false, // note: false disables SSL (deprecated)
  SMTP_SENDER = SMTP_USER
} = process.env

export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN as string, 10) || 43200
export const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15
export const KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')

if (!HASURA_GRAPHQL_ENDPOINT) {
  throw Boom.badImplementation('No Hasura GraphQL endpoint found.')
}
