import { returnBooleanEnvVar } from '../utils'

// Multi-Factor Authentication configuration
export const MFA = {
  get ENABLED() {
    return returnBooleanEnvVar(['MFA_ENABLE', 'MFA_ENABLED'], true)
  },
  get OTP_ISSUER() {
    return process.env.OTP_ISSUER || 'HBP'
  }
}
