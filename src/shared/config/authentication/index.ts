import { castBooleanEnv } from '../utils'

export * from './registration'
export * from './jwt'
export * from './providers'
export * from './mfa'
export * from './cookies'
/**
 * * Authentication settings
 */
export const AUTH_ENABLE = castBooleanEnv('AUTH_ENABLE', true)
export const AUTH_LOCAL_USERS_ENABLE = castBooleanEnv('AUTH_LOCAL_USERS_ENABLE', true)
export const CHANGE_EMAIL_ENABLE = castBooleanEnv('CHANGE_EMAIL_ENABLE', true)
export const NOTIFY_EMAIL_CHANGE = castBooleanEnv('NOTIFY_EMAIL_CHANGE', false)
export const ANONYMOUS_USERS_ENABLE = castBooleanEnv('ANONYMOUS_USERS_ENABLE', false)
export const ALLOW_USER_SELF_DELETE = castBooleanEnv('ALLOW_USER_SELF_DELETE', false)
export const VERIFY_EMAILS = castBooleanEnv('VERIFY_EMAILS', false)
export const LOST_PASSWORD_ENABLE = castBooleanEnv('LOST_PASSWORD_ENABLE', false)
export const FIREBASE_AUTH_ENABLE = castBooleanEnv('FIREBASE_AUTH_ENABLE', false)
