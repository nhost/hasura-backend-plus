import { DEFAULT_USER_ROLE, HIBP_ENABLED, REFRESH_EXPIRES_IN } from './config'
import { NextFunction, Request, Response } from 'express'
import { selectAccountByEmail, selectAccountByTicket } from './queries'
import kebabCase from 'lodash.kebabcase'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'
import argon2 from 'argon2'
import { pwnedPassword } from 'hibp'
import { request } from './request'
import { sign, ClaimValueType } from './jwt'

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
  id,
  default_role = DEFAULT_USER_ROLE,
  account_roles = [],
  user
}: AccountData): string {
  const accountRoles = account_roles.map(({ role: roleName }) => roleName)

  if (!accountRoles.includes(default_role)) {
    accountRoles.push(default_role)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _user_id, ...customFields } = user
  return sign({
    'https://hasura.io/jwt/claims': {
      'x-hasura-user-id': id,
      'x-hasura-allowed-roles': accountRoles,
      'x-hasura-default-role': default_role,
      // Add custom fields based on the user fields fetched from the GQL query
      ...Object.entries(customFields).reduce<{ [k: string]: ClaimValueType }>(
        (aggr, [key, value]) => ({
          ...aggr,
          [`x-${kebabCase(key)}`]: value
        }),
        {}
      )
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

export interface AccountData {
  id: string
  user: {
    id: string
    [key: string]: ClaimValueType
  }
  active: boolean
  default_role: string
  account_roles: { role: string }[]
  is_anonymous: boolean
  ticket?: string
  otp_secret?: string
  mfa_enabled: boolean
  password_hash: string
}

export interface HasuraAccountData {
  auth_accounts: AccountData[]
}

/**
 * Looks for an account in the database, first by email, second by ticket
 * @param httpBody
 * @return account data, null if account is not found
 */
export const selectAccount = async (httpBody: {
  [key: string]: string
}): Promise<AccountData | null> => {
  const { email, ticket } = httpBody
  try {
    if (email) {
      const hasuraData = (await request(selectAccountByEmail, { email })) as HasuraAccountData

      if (hasuraData.auth_accounts && hasuraData.auth_accounts.length) {
        return hasuraData.auth_accounts[0]
      }
    }

    if (ticket) {
      const hasuraData = (await request(selectAccountByTicket, { ticket })) as HasuraAccountData

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateRandomString = (): any => Math.random().toString(36).replace('0.', '')
