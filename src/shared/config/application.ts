import { castIntEnv, castBooleanEnv } from './utils'

/**
 * * Application Settings
 */
export const {
  SERVER_URL,
  REDIRECT_URL_ERROR,
  REDIRECT_URL_SUCCESS,
  HASURA_GRAPHQL_ADMIN_SECRET
} = process.env
export const PORT = castIntEnv('PORT', 3000)
export const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT as string
export const AUTO_MIGRATE = castBooleanEnv('AUTO_MIGRATE', true)
/**
 * * Rate limiter settings
 */
export const MAX_REQUESTS = castIntEnv('MAX_REQUESTS', 100)
export const TIME_FRAME = castIntEnv('TIME_FRAME', 15 * 60 * 1000)

/**
 * * SMTP Settings
 */
export const {
  SMTP_PASS,
  SMTP_HOST,
  SMTP_USER,
  SMTP_SENDER = SMTP_USER,
  SMTP_AUTH_METHOD = 'PLAIN'
} = process.env
export const SMTP_ENABLE = castBooleanEnv('SMTP_ENABLE')
export const SMTP_PORT = castIntEnv('SMTP_PORT', 587)
export const SMTP_SECURE = castBooleanEnv('SMTP_SECURE') // note: false disables SSL (deprecated)
