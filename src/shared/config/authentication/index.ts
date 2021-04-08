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
  AUTH_ENABLE() {
    return castBooleanEnv('AUTH_ENABLE', true)
  },
  AUTH_LOCAL_USERS_ENABLE() {
    return castBooleanEnv('AUTH_LOCAL_USERS_ENABLE', true)
  },
  CHANGE_EMAIL_ENABLE() {
    return castBooleanEnv('CHANGE_EMAIL_ENABLE', true)
  },
  NOTIFY_EMAIL_CHANGE() {
    return castBooleanEnv('NOTIFY_EMAIL_CHANGE', false)
  },
  ANONYMOUS_USERS_ENABLE() {
    return castBooleanEnv('ANONYMOUS_USERS_ENABLE', false)
  },
  ALLOW_USER_SELF_DELETE() {
    return castBooleanEnv('ALLOW_USER_SELF_DELETE', false)
  },
  VERIFY_EMAILS() {
    return castBooleanEnv('VERIFY_EMAILS', false)
  },
  LOST_PASSWORD_ENABLE() {
    return castBooleanEnv('LOST_PASSWORD_ENABLE', false)
  },
  USER_IMPERSONATION_ENABLE() {
    return castBooleanEnv('USER_IMPERSONATION_ENABLE', false)
  },
}