import { castIntEnv, returnBooleanEnvVar } from './utils'

/**
 * * Application Settings
 */
export const APPLICATION = {
  get APP_URL() {
    return process.env.APP_URL || ''
  },
  get SERVER_URL() {
    return process.env.SERVER_URL || ''
  },
  get REDIRECT_URL_ERROR() {
    return process.env.REDIRECT_URL_ERROR || ''
  },
  get REDIRECT_URL_SUCCESS() {
    return process.env.REDIRECT_URL_SUCCESS || ''
  },
  get HASURA_GRAPHQL_ADMIN_SECRET() {
    return process.env.HASURA_GRAPHQL_ADMIN_SECRET || ''
  },
  get HASURA_ENDPOINT() {
    return process.env.HASURA_ENDPOINT || ''
  },

  get HOST() {
    return process.env.HOST || ''
  },
  get PORT() {
    return castIntEnv('PORT', 3000)
  },

  get SMTP_PASS() {
    return process.env.SMTP_PASS || ''
  },
  get SMTP_HOST() {
    return process.env.SMTP_HOST || ''
  },
  get SMTP_USER() {
    return process.env.SMTP_USER || ''
  },
  get SMTP_SENDER() {
    return process.env.SMTP_SENDER || this.SMTP_USER
  },
  get SMTP_AUTH_METHOD() {
    return process.env.SMTP_AUTH_METHOD || 'PLAIN'
  },
  get EMAILS_ENABLE() {
    return returnBooleanEnvVar(['EMAILS_ENABLE', 'EMAILS_ENABLED'], false)
  },
  get SMTP_PORT() {
    return castIntEnv('SMTP_PORT', 587)
  },
  get SMTP_SECURE() {
    return returnBooleanEnvVar(['SMTP_SECURE'], true) // note: false disables SSL (deprecated)
  },

  get MAX_REQUESTS() {
    return castIntEnv('MAX_REQUESTS', 1000)
  },
  get TIME_FRAME() {
    return castIntEnv('TIME_FRAME', 15 * 60 * 1000)
  },
  get HCAPTCHA_SECRET() {
    return process.env.NODE_ENV === 'development' ? '0x0000000000000000000000000000000000000000' : process.env.HCAPTCHA_SECRET || ''
  },
  get HCAPTCHA_LOCAL_RESPONSE() {
    return '10000000-aaaa-bbbb-cccc-000000000001'
  }
}
