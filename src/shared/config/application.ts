import { castIntEnv, castBooleanEnv } from './utils'

const autoMigrateSettings = (envVal?: string): boolean | string => {
  if (envVal?.toLowerCase() === 'true') return true
  if (envVal?.toLowerCase() === 'v1') return 'v1'
  return false
}

/**
 * * Application Settings
 */
export const APPLICATION = {
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
    return castBooleanEnv('EMAILS_ENABLE')
  },
  get SMTP_PORT() {
    return castIntEnv('SMTP_PORT', 587)
  },
  get SMTP_SECURE() {
    return castBooleanEnv('SMTP_SECURE') // note: false disables SSL (deprecated)
  },

  get AUTO_MIGRATE() {
    return autoMigrateSettings(process.env.AUTO_MIGRATE)
  },

  get MAX_REQUESTS() {
    return castIntEnv('MAX_REQUESTS', 1000)
  },
  get TIME_FRAME() {
    return castIntEnv('TIME_FRAME', 15 * 60 * 1000)
  },
}