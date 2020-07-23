import { castBooleanEnv } from '../utils'

export const { COOKIE_SECRET } = process.env
export const COOKIE_SECURE = castBooleanEnv('COOKIE_SECURE')

const sameSiteEnv = process.env.COOKIE_SAME_SITE?.toLowerCase()
let sameSite: boolean | 'lax' | 'strict' | 'none' = 'lax'
if (sameSiteEnv) {
  if (['true', 'false'].includes(sameSiteEnv)) {
    sameSite = Boolean(sameSiteEnv)
  } else if (sameSiteEnv === 'lax' || sameSiteEnv === 'strict' || sameSiteEnv === 'none') {
    sameSite = sameSiteEnv
  } 
} 

export const COOKIE_SAME_SITE = sameSite
