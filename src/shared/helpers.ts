import {
  DEFAULT_USER_ROLE,
  HIBP_ENABLE,
  JWT_REFRESH_EXPIRES_IN,
  JWT_CLAIMS_NAMESPACE
} from './config'
import { ClaimValueType, sign } from './jwt'
import { NextFunction, Request, Response } from 'express'
import {
  rotateTicket as rotateTicketQuery,
  selectAccountByEmail as selectAccountByEmailQuery,
  selectAccountByTicket as selectAccountByTicketQuery,
  selectAccountByUserId as selectAccountByUserIdQuery
} from './queries'

import Boom from '@hapi/boom'
import QRCode from 'qrcode'
import argon2 from 'argon2'
import kebabCase from 'lodash.kebabcase'
import { pwnedPassword } from 'hibp'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'

/**
 * New refresh token expiry date.
 */
export function newRefreshExpiry(): number {
  const now = new Date()
  const days = JWT_REFRESH_EXPIRES_IN / 1440

  return now.setDate(now.getDate() + days)
}

/**
 * Create JWT token.
 * @param id Required v4 UUID string.
 * @param defaultRole Defaults to "user".
 * @param roles Defaults to ["user"].
 */
export function createHasuraJwt({
  default_role = DEFAULT_USER_ROLE,
  account_roles = [],
  user
}: AccountData): string {
  const accountRoles = account_roles.map(({ role: roleName }) => roleName)

  if (!accountRoles.includes(default_role)) {
    accountRoles.push(default_role)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...customFields } = user
  return sign({
    [JWT_CLAIMS_NAMESPACE]: {
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
export async function createQR(secret: string): Promise<string> {
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
  [key: string]: ClaimValueType
  id: string
  email?: string
  display_name: string
  avatar_url?: string
}
export interface AccountData {
  id: string
  user: UserData
  active: boolean
  default_role: string
  account_roles: { role: string }[]
  is_anonymous: boolean
  ticket?: string
  otp_secret?: string
  mfa_enabled: boolean
  password_hash: string
  email: string
  new_email?: string
}

export interface HasuraAccountData {
  auth_accounts: AccountData[]
}

export interface HasuraUpdateAccountData {
  update_auth_accounts: {
    affected_rows: number
    // AccountData[]
  }
}

export interface HasuraDeleteAccountData {
  delete_auth_accounts: { affected_rows: number }
}
interface AccountProvider {
  account: AccountData
}

export interface AccountProviderData {
  auth_account_providers: AccountProvider[]
}

export interface InsertAccountData {
  insert_auth_accounts: {
    returning: AccountData[]
  }
}

export const selectAccountByEmail = async (email: string): Promise<AccountData> => {
  const hasuraData = await request<HasuraAccountData>(selectAccountByEmailQuery, { email })
  if (!hasuraData.auth_accounts[0]) throw Boom.badRequest('Account does not exist.')
  return hasuraData.auth_accounts[0]
}

const selectAccountByTicket = async (ticket: string): Promise<AccountData> => {
  const hasuraData = await request<HasuraAccountData>(selectAccountByTicketQuery, { ticket })
  if (!hasuraData.auth_accounts[0]) throw Boom.badRequest('Account does not exist.')
  return hasuraData.auth_accounts[0]
}

// TODO await request returns undefined if no user found!
export const selectAccountByUserId = async (user_id: string | undefined): Promise<AccountData> => {
  if (!user_id) {
    throw Boom.badRequest('Invalid User Id.')
  }
  const hasuraData = await request<HasuraAccountData>(selectAccountByUserIdQuery, { user_id })
  if (!hasuraData.auth_accounts[0]) throw Boom.badRequest('Account does not exist.')
  return hasuraData.auth_accounts[0]
}

/**
 * Looks for an account in the database, first by email, second by ticket
 * @param httpBody
 * @return account data, null if account is not found
 */
export const selectAccount = async (httpBody: {
  [key: string]: string
}): Promise<AccountData | undefined> => {
  const { email, ticket } = httpBody
  try {
    return await selectAccountByEmail(email)
  } catch {
    try {
      return await selectAccountByTicket(ticket)
    } catch {
      return undefined
    }
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
  if (HIBP_ENABLE && (await pwnedPassword(password))) {
    throw Boom.badRequest('Password is too weak.')
  }
}

export const generateRandomString = (): string => Math.random().toString(36).replace('0.', '')

export const rotateTicket = async (ticket: string): Promise<unknown> =>
  await request(rotateTicketQuery, {
    ticket,
    now: new Date(),
    new_ticket: uuidv4()
  })
