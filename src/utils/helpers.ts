import jwt, { Algorithm } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const { HASURA_GRAPHQL_JWT_SECRET_KEY, JWT_ALGORITHM = 'HS256' } = process.env

export const signed = process.env.COOKIE_SECRET ? true : false
export const active = process.env.AUTO_ACTIVATE ? true : false

const jwtExpiresIn = parseInt(<string>process.env.JWT_EXPIRES_IN, 10) || 15
const refreshExpiresIn = parseInt(<string>process.env.REFRESH_EXPIRES_IN, 10) || 43200

const _defaultRole = <string>process.env.DEFAULT_ROLE || 'user'

export const newJwtExpiry = jwtExpiresIn * 60 * 1000

export const newRefreshExpiry = () => {
  const now = new Date()
  const days = refreshExpiresIn / 1440
  return now.setDate(now.getDate() + days)
}

export const createToken = (
  id: string,
  defaultRole: string = _defaultRole,
  roles: string[] = [defaultRole]
) => {
  return jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-user-id': id,
        'x-hasura-allowed-roles': roles,
        'x-hasura-default-role': defaultRole
      }
    },
    HASURA_GRAPHQL_JWT_SECRET_KEY as string,
    {
      algorithm: JWT_ALGORITHM as Algorithm,
      expiresIn: `${jwtExpiresIn}m`
    }
  )
}

/**
 * This asynchronous wrapper is used for all routes (`src/routes/*.ts`).
 * All thrown errors are caught and sent to `next()`. The error middleware
 * in `src/utils/errors.ts` takes care of the rest.
 */
export function asyncWrapper(fn: any) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next)
  }
}
