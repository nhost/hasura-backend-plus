import jwt, { Algorithm } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const { HASURA_GRAPHQL_JWT_SECRET_KEY, JWT_ALGORITHM = 'HS256' } = process.env

export const signed = process.env.COOKIE_SECRET ? true : false
export const active = process.env.AUTO_ACTIVATE ? true : false

export const DEFAULT_ROLE = <string>process.env.DEFAULT_ROLE || 'user'
export const JWT_EXPIRES_AT = parseInt(<string>process.env.JWT_EXPIRES_AT, 10) || 15
export const REFRESH_EXPIRES_AT = parseInt(<string>process.env.REFRESH_EXPIRES_AT, 10) || 43200

export const createToken = (id: string, defaultRole: string, roles: string[] = [defaultRole]) => {
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
      expiresIn: `${JWT_EXPIRES_AT}m`
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
