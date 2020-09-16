import { castBooleanEnv } from '../utils'

export const { OTP_ISSUER = 'HBP' } = process.env

// Multi-Factor Authentication configuration
export const MFA_ENABLE = castBooleanEnv('MFA_ENABLE', true)
