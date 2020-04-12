import Boom from '@hapi/boom'
import dotenv from 'dotenv'
import path from 'path'

// * Load '.env' file if production mode, '.env.<NODE_ENV>' otherwise
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `.env.${process.env.NODE_ENV}`
    : '.env'
dotenv.config({ path: envFile })

// * Helpers for casting environment variables
const castBooleanEnv = (envVar: string, defaultValue = false): boolean =>
  process.env[envVar] ? process.env[envVar]?.toLowerCase() === 'true' : defaultValue
const castIntEnv = (envVar: string, defaultValue: number): number =>
  parseInt(process.env[envVar] as string, 10) || defaultValue
const castStringArrayEnv = (envVar: string): string[] =>
  (process.env[envVar] || '').split(',').map((field) => field.trim())

/**
 * * Application Settings
 */
export const {
  SERVER_URL,
  REDIRECT_URL_ERROR,
  REDIRECT_URL_SUCCESS,
  // Hasura settings.
  HASURA_ENDPOINT,
  HASURA_GRAPHQL_ADMIN_SECRET
} = process.env
export const PORT = castIntEnv('PORT', 3000)

/**
 * * Rate limiter settings
 */
export const MAX_REQUESTS = castIntEnv('MAX_REQUESTS', 100)
export const TIME_FRAME = castIntEnv('TIME_FRAME', 15 * 60 * 1000)

/**
 * * Authentication settings
 */
export const {
  COOKIE_SECRET,
  JWT_SECRET_KEY,
  AUTH_OTP_ISSUER = 'HBP',
  ALLOWED_EMAIL_DOMAINS,
  JWT_ALGORITHM = 'RS256',
  AUTH_DEFAULT_ROLE = 'user'
} = process.env
export const AUTH_ENABLE = castBooleanEnv('AUTH_ENABLE', true)
export const AUTH_AUTO_ACTIVATE_NEW_USERS = castBooleanEnv('AUTH_AUTO_ACTIVATE_NEW_USERS')
export const AUTH_CLAIMS_FIELDS = castStringArrayEnv('AUTH_CLAIMS_FIELDS')
export const AUTH_HIBP_ENABLE = castBooleanEnv('AUTH_HIBP_ENABLE')
export const AUTH_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'custom/keys/private.pem')
export const AUTH_REGISTRATION_FIELDS = castStringArrayEnv('AUTH_REGISTRATION_FIELDS')

// Multi-Factor Authentication configuration
export const AUTH_MFA_ENABLE = castBooleanEnv('AUTH_MFA_ENABLE', true)

// OAuth settings
export const AUTH_GITHUB_ENABLE = castBooleanEnv('AUTH_GITHUB_ENABLE')
export const AUTH_GITHUB_CALLBACK_URL = `${SERVER_URL}/auth/providers/github/callback`
export const {
  // External OAuth provider redirect URLS
  PROVIDERS_SUCCESS_REDIRECT = REDIRECT_URL_SUCCESS,
  PROVIDERS_FAILURE_REDIRECT = REDIRECT_URL_ERROR,
  //Github OAuth provider settings
  AUTH_GITHUB_CLIENT_ID,
  AUTH_GITHUB_CLIENT_SECRET,
  AUTH_GITHUB_AUTHORIZATION_URL, // enterprise
  AUTH_GITHUB_TOKEN_URL, // enterprise
  AUTH_GITHUB_USER_PROFILE_URL // enterprise
} = process.env

export const REFRESH_EXPIRES_IN = castIntEnv('REFRESH_EXPIRES_IN', 43200)
export const JWT_EXPIRES_IN = castIntEnv('JWT_EXPIRES_IN', 15)
export const MIN_PASSWORD_LENGTH = castIntEnv('MIN_PASSWORD_LENGTH', 3)

/**
 * * Storage Settings
 */
export const STORAGE_ENABLE = castBooleanEnv('STORAGE_ENABLE', true)
export const { S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env

/**
 * * SMTP Settings
 */
export const { SMTP_PASS, SMTP_HOST, SMTP_USER, SMTP_SENDER = SMTP_USER } = process.env
export const SMTP_ENABLE = castBooleanEnv('SMTP_ENABLE')
export const SMTP_PORT = castIntEnv('SMTP_PORT', 587)
export const SMTP_SECURE = castBooleanEnv('SMTP_SECURE') // note: false disables SSL (deprecated)

/**
 * * Check required settings, and raise an error if some are missing.
 */
if (!HASURA_ENDPOINT) {
  throw Boom.badImplementation('No Hasura GraphQL endpoint found.')
}
