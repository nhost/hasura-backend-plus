import { NextFunction, Request, Response } from 'express'
import jwt, { Algorithm } from 'jsonwebtoken'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'
import { request } from './request'
import { selectUserByEmail, selectUserByUsername } from './queries'

/**
 * Destructuring environment variables.
 */
export const {
  COOKIE_SECRET: signed,
  AUTO_ACTIVATE: active,
  JWT_ALGORITHM = 'HS256',
  DEFAULT_USER_ROLE: _defaultUserRole = 'user'
} = process.env

const refreshExpiresIn = parseInt(process.env.REFRESH_EXPIRES_IN as string, 10) || 43200

const jwtSecretKey = process.env.HASURA_GRAPHQL_JWT_SECRET_KEY as string
const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15

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
export function createJwt({
  user: { id, default_role = _defaultUserRole, roles = [] }
}: UserData): unknown {
  const userRoles = roles.map(({ role }) => role)
  if (!userRoles.includes(default_role)) userRoles.push(default_role)
  return jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-user-id': id,
        'x-hasura-allowed-roles': roles,
        'x-hasura-default-role': default_role
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
    throw Boom.unauthorized()
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

/**
 * This wrapper function sends any route errors to `next()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncWrapper(fn: any) {
  return function(req: Request, res: Response, next: NextFunction): void {
    fn(req, res, next).catch(next)
  }
}

export interface UserData {
  user: {
    id: string
    active: boolean
    default_role: string
    roles: { role: string }[]
    is_anonymous: boolean
    ticket?: string
  }
  otp_secret?: string
  mfa_enabled: boolean
  password_hash: string
}
export interface HasuraUserData {
  private_user_accounts: UserData[]
}

/**
 * Looks for an user in the database, first by email, second by username
 * @param httpBody
 * @return user data, null if users is not found
 */
export const selectUser = async (httpBody: { [key: string]: string }): Promise<UserData | null> => {
  const { username, email } = httpBody
  try {
    if (email) {
      const hasuraData_1 = (await request(selectUserByEmail, { email })) as HasuraUserData
      if (hasuraData_1.private_user_accounts && hasuraData_1.private_user_accounts.length)
        return hasuraData_1.private_user_accounts[0]
    }
    if (username) {
      const hasuraData_2 = (await request(selectUserByUsername, { username })) as HasuraUserData
      if (hasuraData_2.private_user_accounts && hasuraData_2.private_user_accounts.length)
        return hasuraData_2.private_user_accounts[0]
    }
    return null
  } catch (err) {
    throw Boom.badImplementation()
  }
}
