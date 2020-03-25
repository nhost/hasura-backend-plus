import { DEFAULT_USER_ROLE, HIBP_ENABLED, REFRESH_EXPIRES_IN } from './config'
import { NextFunction, Request, Response } from 'express'
import { selectUserByEmail, selectUserByTicket, selectUserByUsername } from './queries'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'
import argon2 from 'argon2'
import { pwnedPassword } from 'hibp'
import { request } from './request'
import { sign } from './jwt'

/**
 * New refresh token expiry date.
 */
export function newRefreshExpiry(): number {
  const now = new Date()
  const days = REFRESH_EXPIRES_IN / 1440

  return now.setDate(now.getDate() + days)
}

/**
 * Create JWT token.
 * @param id Required v4 UUID string.
 * @param defaultRole Defaults to "user".
 * @param roles Defaults to ["user"].
 */
export function createHasuraJwt({
  user: {
     id,
   },
   default_role = DEFAULT_USER_ROLE,
   roles = []
}: UserData): string {
  const userRoles = roles.map(({ role }) => role)

  if (!userRoles.includes(default_role)) {
    userRoles.push(default_role)
  }

  return sign({
    'https://hasura.io/jwt/claims': {
      'x-hasura-user-id': id,
      'x-hasura-allowed-roles': userRoles,
      'x-hasura-default-role': default_role
    }
  })
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
  return function (req: Request, res: Response, next: NextFunction): void {
    fn(req, res, next).catch(next)
  }
}

export interface UserData {
  user: {
    id: string
  }
  active: boolean
  default_role: string
  roles: { role: string }[]
  is_anonymous: boolean
  ticket?: string
  otp_secret?: string
  mfa_enabled: boolean
  password_hash: string
}

export interface HasuraUserData {
  auth_accounts: UserData[]
}

/**
 * Looks for an user in the database, first by email, second by username
 * @param httpBody
 * @return user data, null if user is not found
 */
export const selectUser = async (httpBody: { [key: string]: string }): Promise<UserData | null> => {
  const { email, ticket } = httpBody

  try {
    if (email) {
      const hasuraData = (await request(selectUserByEmail, { email })) as HasuraUserData

      if (hasuraData.auth_accounts && hasuraData.auth_accounts.length) {
        return hasuraData.auth_accounts[0]
      }
    }

    if (ticket) {
      const hasuraData = (await request(selectUserByTicket, { ticket })) as HasuraUserData

      if (hasuraData.auth_accounts && hasuraData.auth_accounts.length) {
        return hasuraData.auth_accounts[0]
      }
    }
    return null
  } catch (err) {
    throw Boom.badImplementation()
  }
}

/**
 * Password hashing function.
 * @param password Password to hash.
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password)
  } catch (err) {
    throw Boom.badImplementation()
  }
}

/**
 * Checks password against the HIBP API.
 * @param password Password to check.
 */
export const checkHibp = async (password: string): Promise<void> => {
  if (HIBP_ENABLED && (await pwnedPassword(password))) {
    throw Boom.badRequest('Password is too weak.')
  }
}
