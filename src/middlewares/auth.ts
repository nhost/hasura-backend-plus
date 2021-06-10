import { Response, NextFunction } from 'express'
import { RequestExtended } from '@shared/types'
import { getClaims, getPermissionVariablesFromClaims } from '@shared/jwt'

export function authMiddleware(req: RequestExtended, res: Response, next: NextFunction) {
  try {
    req.permission_variables = getPermissionVariablesFromClaims(
      getClaims(req.headers.authorization)
    )
  } catch (e) {
    // noop
  }

  if ('refresh_token' in req.query) {
    req.refresh_token = req.query.refresh_token as string
    delete req.query.refresh_token
  }

  next()
}
