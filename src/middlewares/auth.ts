import { Response, NextFunction } from 'express'
import { RefreshTokenMiddleware, RequestExtended, PermissionVariables, Claims } from '@shared/types'
import { getClaims } from '@shared/jwt'

export function authMiddleware(req: RequestExtended, res: Response, next: NextFunction) {
  let refresh_token = {
    value: null,
    type: null
  } as RefreshTokenMiddleware
  // let permission_variables = {};

  // check for Authorization header
  let claimsInBody = false
  let claims: Claims | null = null

  try {
    claims = getClaims(req.headers.authorization)
    claimsInBody = true
  } catch (e) {
    // noop
  }

  if (claimsInBody && claims) {
    // remove `x-hasura-` from claim props
    const claims_sanatized: { [k: string]: any } = {}
    for (const claimKey in claims) {
      claims_sanatized[claimKey.replace('x-hasura-', '') as string] = claims[claimKey]
    }

    req.permission_variables = claims_sanatized as PermissionVariables
  }

  // check for refresh token in body?
  if ('refresh_token' in req.query) {
    refresh_token = {
      value: req.query.refresh_token as string,
      type: 'query'
    }
    req.refresh_token = refresh_token
  }

  next()
}
