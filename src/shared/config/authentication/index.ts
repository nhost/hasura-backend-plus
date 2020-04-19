import { castBooleanEnv } from '../utils'

export * from './registration'
export * from './jwt'
export * from './providers'
export * from './mfa'

/**
 * * Authentication settings
 */
export const AUTH_ENABLE = castBooleanEnv('AUTH_ENABLE', true)
export const { COOKIE_SECRET } = process.env
