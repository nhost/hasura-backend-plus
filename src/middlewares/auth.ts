import { Response, NextFunction } from 'express'
import { RequestExtended, PermissionVariables, Claims } from '@shared/types'
import { getClaims } from '@shared/jwt'

export function authMiddleware(req: RequestExtended, res: Response, next: NextFunction) {
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

  if ('refresh_token' in req.query) {
    req.refresh_token = req.query.refresh_token as string
    delete req.query.refresh_token
  }

  next()
}
