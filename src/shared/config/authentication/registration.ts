import { castBooleanEnv, castStringArrayEnv, castIntEnv } from '../utils'

/**
 * *  Registration settings
 * */
export const {
  ALLOWED_EMAIL_DOMAINS,
  DEFAULT_USER_ROLE = 'user',
  DEFAULT_ANONYMOUS_ROLE = 'anonymous'
} = process.env
export const AUTO_ACTIVATE_NEW_USERS = castBooleanEnv('AUTO_ACTIVATE_NEW_USERS', true)
export const HIBP_ENABLE = castBooleanEnv('HIBP_ENABLE')
export const REGISTRATION_CUSTOM_FIELDS = castStringArrayEnv('REGISTRATION_CUSTOM_FIELDS')
export const MIN_PASSWORD_LENGTH = castIntEnv('MIN_PASSWORD_LENGTH', 3)
export const DEFAULT_ALLOWED_USER_ROLES = castStringArrayEnv('DEFAULT_ALLOWED_USER_ROLES', [
  DEFAULT_USER_ROLE
])
