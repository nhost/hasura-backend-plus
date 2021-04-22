import { castBooleanEnv } from '../utils'

export * from './registration'
export * from './jwt'
export * from './providers'
export * from './mfa'
export * from './cookies'

/**
 * * Authentication settings
 */
export const AUTHENTICATION = {
  get ENABLE() {
    return castBooleanEnv('AUTH_ENABLE', true)
  },
  get AUTH_LOCAL_USERS_ENABLE() {
    return castBooleanEnv('AUTH_LOCAL_USERS_ENABLE', true)
  },
  get CHANGE_EMAIL_ENABLE() {
    return castBooleanEnv('CHANGE_EMAIL_ENABLE', true)
  },
  get NOTIFY_EMAIL_CHANGE() {
    return castBooleanEnv('NOTIFY_EMAIL_CHANGE', false)
  },
  get ANONYMOUS_USERS_ENABLE() {
    return castBooleanEnv('ANONYMOUS_USERS_ENABLE', false)
  },
  get ALLOW_USER_SELF_DELETE() {
    return castBooleanEnv('ALLOW_USER_SELF_DELETE', false)
  },
  get VERIFY_EMAILS() {
    return castBooleanEnv('VERIFY_EMAILS', false)
  },
  get LOST_PASSWORD_ENABLE() {
    return castBooleanEnv('LOST_PASSWORD_ENABLE', false)
  },
  get USER_IMPERSONATION_ENABLE() {
    return castBooleanEnv('USER_IMPERSONATION_ENABLE', false)
  },
  get ENABLE_MAGIC_LINK() {
    return castBooleanEnv('ENABLE_MAGIC_LINK', false)
  }
}
