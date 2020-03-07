import jwt, { Algorithm } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const {
  HASURA_GRAPHQL_JWT_SECRET_KEY,
  JWT_ALGORITHM = 'HS256',
  JWT_EXPIRES_AT = '15m'
} = process.env

/**
 * Generates a JWT token with Hasura claims
 * @param user A user object
 */
export const generateJwtToken = ({ id }: any) => {
  return jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'user',
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-user-id': id.toString()
      }
    },
    HASURA_GRAPHQL_JWT_SECRET_KEY as string,
    {
      algorithm: JWT_ALGORITHM as Algorithm,
      expiresIn: JWT_EXPIRES_AT
    }
  )
}

/**
 * Refresh token expires in 43200 minutes (30 days) by default
 */
export const REFRESH_EXPIRES_AT = parseInt(<string>process.env.REFRESH_EXPIRES_AT, 10) || 43200

/**
 * Helper function to avoid try/catch boilerplate code
 * @param fn Asynchronous function
 */
export function async(fn: any) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next)
  }
}
