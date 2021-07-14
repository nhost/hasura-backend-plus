import { castBooleanEnv, castStringArrayEnv, castIntEnv, returnBooleanEnvVar } from '../utils'

/**
 * * Registration settings
 */
export const REGISTRATION = {
  get ALLOWED_EMAIL_DOMAINS() {
    return process.env.ALLOWED_EMAIL_DOMAINS
  },
  get DEFAULT_USER_ROLE() {
    return process.env.DEFAULT_USER_ROLE || 'user'
  },
  get DEFAULT_ANONYMOUS_ROLE() {
    return process.env.DEFAULT_ANONYMOUS_ROLE || 'anonymous'
  },
  get AUTO_ACTIVATE_NEW_USERS() {
    return castBooleanEnv('AUTO_ACTIVATE_NEW_USERS', true)
  },
  get HIBP_ENABLED() {
    return returnBooleanEnvVar(['HIBP_ENABLE', 'HIBP_ENABLED'], false)
  },
  get CUSTOM_FIELDS() {
    return castStringArrayEnv('REGISTRATION_CUSTOM_FIELDS')
  },
  get MIN_PASSWORD_LENGTH() {
    return castIntEnv('MIN_PASSWORD_LENGTH', 3)
  },
  get DEFAULT_ALLOWED_USER_ROLES() {
    return castStringArrayEnv('DEFAULT_ALLOWED_USER_ROLES', [this.DEFAULT_USER_ROLE])
  },
  get ALLOWED_USER_ROLES() {
    return castStringArrayEnv('ALLOWED_USER_ROLES', this.DEFAULT_ALLOWED_USER_ROLES)
  }
}
