import { NextFunction, Request, Response } from 'express'
import jwt, { Algorithm } from 'jsonwebtoken'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'

/**
 * Destructuring environment variables.
 */
export const { COOKIE_SECRET: signed, AUTO_ACTIVATE: active, JWT_ALGORITHM = 'HS256' } = process.env

const refreshExpiresIn = parseInt(<string>process.env.REFRESH_EXPIRES_IN, 10) || 43200

const jwtSecretKey = <string>process.env.HASURA_GRAPHQL_JWT_SECRET_KEY
const jwtExpiresIn = parseInt(<string>process.env.JWT_EXPIRES_IN, 10) || 15
const _defaultRole = <string>process.env.DEFAULT_ROLE || 'user'

export const newJwtExpiry = jwtExpiresIn * 60 * 1000

/**
 * New refresh token expiry date.
 */
export function newRefreshExpiry() {
  const now = new Date()
  const days = refreshExpiresIn / 1440
  return now.setDate(now.getDate() + days)
}

/**
 * Create JWT token.
 * @param id Required v4 UUID string.
 * @param defaultRole Defaults to "user".
 * @param roles Defaults to ["user"].
 */
export function createJwt(
  id: string,
  defaultRole: string = _defaultRole,
  roles: string[] = [defaultRole]
) {
  return jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-user-id': id,
        'x-hasura-allowed-roles': roles,
        'x-hasura-default-role': defaultRole
      }
    },
    jwtSecretKey,
    {
      algorithm: JWT_ALGORITHM as Algorithm,
      expiresIn: `${jwtExpiresIn}m`
    }
  )
}

/**
 * Exported token interface.
 */
export interface Token {
  'https://hasura.io/jwt/claims': {
    'x-hasura-user-id': string
    'x-hasura-default-role': string
    'x-hasura-allowed-roles': any[]
  }
  exp: bigint
  iat: bigint
}

/**
 * Verify JWT token.
 * @param authorization Authorization header.
 */
export async function verifyJwt(authorization: string) {
  try {
    if (!authorization) throw new Error()
    const token = authorization.replace('Bearer ', '')
    return jwt.verify(token, jwtSecretKey) as Token
  } catch (err) {
    throw Boom.unauthorized()
  }
}

/**
 * Create QR code.
 * @param text Required OTP secret.
 */
export async function createQR(text: string) {
  try {
    return await QRCode.toDataURL(text)
  } catch (err) {
    throw Boom.badImplementation()
  }
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
