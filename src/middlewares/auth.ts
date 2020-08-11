import { Response, NextFunction } from 'express'
import { COOKIE_SECRET } from '@shared/config'
import { RefreshTokenMiddleware, RequestExtended } from '@shared/types'
import { getClaims } from '@shared/jwt'

export function authMiddleware(req: RequestExtended, res: Response, next: NextFunction): void {
  let refresh_token = {
    value: null,
    type: null
  } as RefreshTokenMiddleware
  // let permission_variables = {};

  // check for Authorization header
  let claims
  try {
    claims = getClaims(req.headers.authorization)
  } catch (e) {
    // noop
    console.log('unable to get claims from authorization header')
  }

  console.log('claims:')
  console.log(claims)

  // check for refresh token in body?
  if ('refresh_token' in req.query) {
    refresh_token = {
      value: req.query.refresh_token as string,
      type: 'query'
    }
  }

  // check for cookies
  const cookies_in_use = COOKIE_SECRET ? req.signedCookies : req.cookies

  if ('refresh_token' in cookies_in_use) {
    refresh_token = {
      value: cookies_in_use.refresh_token,
      type: 'cookie'
    }
  }

  if ('permission_variables' in cookies_in_use) {
    // permission_variables =
  }

  console.log({ refresh_token })

  req.refresh_token = refresh_token

  // if (refresh_token) console.log('in auth middleware')
  next()
}
