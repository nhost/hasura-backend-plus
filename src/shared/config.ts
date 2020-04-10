import Boom from '@hapi/boom'
import dotenv from 'dotenv'
import path from 'path'

// Load '.env' file if production mode, '.env.<NODE_ENV>' otherwise
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `.env.${process.env.NODE_ENV}`
    : '.env'
dotenv.config({ path: envFile })

/**
 * Destructuring environment variables.
 */
export const {
  /**
   * App settings.
   */
  SERVER_URL,
  PORT = 3000,
  REDIRECT_URL_ERROR,
  REDIRECT_URL_SUCCESS,

  /**
   * Hasura settings.
   */
  HASURA_ENDPOINT,
  HASURA_GRAPHQL_ADMIN_SECRET,

  /**
   * Authentication settings.
   */
  COOKIE_SECRET,
  JWT_SECRET_KEY,
  OTP_ISSUER = 'HBP',
  ALLOWED_EMAIL_DOMAINS,
  JWT_ALGORITHM = 'RS256',
  DEFAULT_USER_ROLE = 'user',

  /**
   * External OAuth provider redirect URLS
   */
  PROVIDERS_SUCCESS_REDIRECT,
  PROVIDERS_FAILURE_REDIRECT,

  /**
   * Github OAuth provider settings
   */
  AUTH_GITHUB_ACTIVE = false,
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_CALLBACK_URL,
  AUTH_GITHUB_AUTHORIZATION_URL = null, // enterprise
  AUTH_GITHUB_TOKEN_URL = null, // enterprise
  AUTH_GITHUB_USER_PROFILE_URL = null, // enterprise

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
  SMTP_PORT = 587,
  SMTP_SENDER = SMTP_USER
} = process.env

// Boolean environment variables are stored as string, we must transform them into booleans.
const getBooleanEnv = (envVar: string, defaultValue = false): boolean =>
  process.env[envVar] ? process.env[envVar]?.toLowerCase() === 'true' : defaultValue
export const AUTO_ACTIVATE_USER_ON_REGISTRATION = getBooleanEnv(
  'AUTO_ACTIVATE_USER_ON_REGISTRATION'
)
export const HIBP_ENABLED = getBooleanEnv('HIBP_ENABLED')
export const SMTP_ENABLED = getBooleanEnv('SMTP_ENABLED')
export const SMTP_SECURE = getBooleanEnv('SMTP_SECURE') // note: false disables SSL (deprecated)

export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN as string, 10) || 43200
export const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15
export const KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')

export const MIN_PASSWORD_LENGTH = parseInt(process.env.MIN_PASSWORD_LENGTH as string, 10) || 3

if (!HASURA_ENDPOINT) {
  throw Boom.badImplementation('No Hasura GraphQL endpoint found.')
}

export const USER_CLAIMS_FIELDS = (process.env.USER_CLAIMS_FIELDS || '')
  .split(',')
  .map((field) => field.trim())

export const USER_REGISTRATION_FIELDS = (process.env.USER_REGISTRATION_FIELDS || '')
  .split(',')
  .map((field) => field.trim())
