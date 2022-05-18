import { castBooleanEnv } from '../utils'

export const COOKIES = {
  get SECRET() {
    return process.env.COOKIE_SECRET || ''
  },
  get SECURE() {
    return castBooleanEnv('COOKIE_SECURE')
  },
  get SAME_SITE() {
    const sameSiteEnv = process.env.COOKIE_SAME_SITE?.toLowerCase()

    let sameSite: boolean | 'lax' | 'strict' | 'none' = 'lax'
    if (sameSiteEnv) {
      if (['true', 'false'].includes(sameSiteEnv)) {
        sameSite = Boolean(sameSiteEnv)
      } else if (sameSiteEnv === 'lax' || sameSiteEnv === 'strict' || sameSiteEnv === 'none') {
        sameSite = sameSiteEnv
      }
    }
    return sameSite
  }
}
