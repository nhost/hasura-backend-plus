import { NextFunction, Request, Response } from 'express'
import jwt, { Algorithm } from 'jsonwebtoken'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'

/**
 * Destructuring environment variables.
 */
export const { COOKIE_SECRET: signed, AUTO_ACTIVATE: active, JWT_ALGORITHM = 'HS256' } = process.env

const refreshExpiresIn = parseInt(process.env.REFRESH_EXPIRES_IN as string, 10) || 43200

const jwtSecretKey = process.env.HASURA_GRAPHQL_JWT_SECRET_KEY as string
const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15
const _defaultRole = (process.env.DEFAULT_ROLE as string) || 'user'

export const newJwtExpiry = jwtExpiresIn * 60 * 1000

/**
 * New refresh token expiry date.
 */
export function newRefreshExpiry(): number {
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
): unknown {
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
 * Token interface.
 */
interface Token {
  'https://hasura.io/jwt/claims': {
    'x-hasura-user-id': string
    'x-hasura-default-role': string
    'x-hasura-allowed-roles': unknown[]
  }
  exp: bigint
  iat: bigint
}

/**
 * Verify JWT token.
 * @param authorization Authorization header.
 */
export async function verifyJwt(authorization: string): Promise<Token> {
  try {
    if (!authorization) throw new Error()
    const token = authorization.replace('Bearer ', '')
    return jwt.verify(token, jwtSecretKey) as Token
  } catch (err) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }
}

/**
 * Create QR code.
 * @param secret Required OTP secret.
 */
export async function createQR(secret: string): Promise<unknown> {
  try {
    return await QRCode.toDataURL(secret)
  } catch (err) {
    throw Boom.badImplementation()
  }
}

export function getAWSOptions(): object {
  return {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
}

/**
 * This wrapper function sends any route errors to `next()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncWrapper(fn: any) {
  return function(req: Request, res: Response, next: NextFunction): void {
    fn(req, res, next).catch(next)
  }
}
