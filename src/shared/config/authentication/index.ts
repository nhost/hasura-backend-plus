import { returnBooleanEnvVar } from '../utils'

export * from './registration'
export * from './jwt'
export * from './providers'
export * from './mfa'
export * from './sms-mfa'
export * from './cookies'

/**
 * * Authentication settings
 */
export const AUTHENTICATION = {
  get ENABLED() {
    return returnBooleanEnvVar(['AUTH_ENABLE', 'AUTH_ENABLED'], true)
  },
  get AUTH_LOCAL_USERS_ENABLED() {
    return returnBooleanEnvVar(['AUTH_LOCAL_USERS_ENABLE', 'AUTH_LOCAL_USERS_ENABLED'], true)
  },
  get CHANGE_EMAIL_ENABLED() {
    return returnBooleanEnvVar(['CHANGE_EMAIL_ENABLE', 'CHANGE_EMAIL_ENABLED'], true)
  },
  get NOTIFY_EMAIL_CHANGE() {
    return returnBooleanEnvVar(['NOTIFY_EMAIL_CHANGE', 'NOTIFY_EMAIL_CHANGE'], false)
  },
  get ANONYMOUS_USERS_ENABLED() {
    return returnBooleanEnvVar(['ANONYMOUS_USERS_ENABLE', 'ANONYMOUS_USERS_ENABLED'], false)
  },
  get ALLOW_USER_SELF_DELETE() {
    return returnBooleanEnvVar(['ALLOW_USER_SELF_DELETE'], false)
  },
  get VERIFY_EMAILS() {
    return returnBooleanEnvVar(['VERIFY_EMAILS'], false)
  },
  get LOST_PASSWORD_ENABLED() {
    return returnBooleanEnvVar(['LOST_PASSWORD_ENABLE', 'LOST_PASSWORD_ENABLED'], false)
  },
  get USER_IMPERSONATION_ENABLED() {
    return returnBooleanEnvVar(['USER_IMPERSONATION_ENABLE', 'USER_IMPERSONATION_ENABLED'], false)
  },
  get MAGIC_LINK_ENABLED() {
    return returnBooleanEnvVar(['MAGIC_LINK_ENABLE', 'MAGIC_LINK_ENABLED'], false)
  }
}
