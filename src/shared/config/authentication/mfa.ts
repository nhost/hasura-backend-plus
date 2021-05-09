import { castBooleanEnv } from '../utils'

// Multi-Factor Authentication configuration
export const MFA = {
  get ENABLE() {
    return castBooleanEnv('MFA_ENABLE', true)
  },
  get OTP_ISSUER() {
    return process.env.OTP_ISSUER || 'HBP'
  }
}