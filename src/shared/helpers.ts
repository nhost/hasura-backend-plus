import { JWT, REGISTRATION } from './config'
import { NextFunction, Response } from 'express'
import {
  deanonymizeAccount as deanonymizeAccountQuery,
  insertRefreshToken,
  rotateTicket as rotateTicketQuery,
  selectAccountByEmail as selectAccountByEmailQuery,
  selectAccountByTicket as selectAccountByTicketQuery,
  selectAccountByUserId as selectAccountByUserIdQuery
} from './queries'

import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { pwnedPassword } from 'hibp'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'
import { AccountData, QueryAccountData, RequestExtended } from './types'

/**
 * Create QR code.
 * @param secret Required OTP secret.
 */
export async function createQR(secret: string): Promise<string> {
  try {
    return await QRCode.toDataURL(secret)
  } catch (err) {
    throw new Error('Could not create QR code')
  }
}

/**
 * This wrapper function sends any route errors to `next()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncWrapper(fn: any) {
  return function (req: RequestExtended, res: Response, next: NextFunction): void {
    fn(req, res, next).catch(next)
  }
}

export const selectAccountByEmail = async (email: string): Promise<AccountData> => {
  const hasuraData = await request<QueryAccountData>(selectAccountByEmailQuery, { email })
  if (!hasuraData.auth_accounts[0]) throw new Error('Account does not exist.')
  return hasuraData.auth_accounts[0]
}

export const selectAccountByTicket = async (ticket: string): Promise<AccountData> => {
  const hasuraData = await request<QueryAccountData>(selectAccountByTicketQuery, {
    ticket,
    now: new Date()
  })
  if (!hasuraData.auth_accounts[0]) throw new Error('Account does not exist.')
  return hasuraData.auth_accounts[0]
}

// TODO await request returns undefined if no user found!
export const selectAccountByUserId = async (user_id: string | undefined): Promise<AccountData> => {
  if (!user_id) {
    throw new Error('Invalid User Id.')
  }
  const hasuraData = await request<QueryAccountData>(selectAccountByUserIdQuery, { user_id })
  if (!hasuraData.auth_accounts[0]) throw new Error('Account does not exist.')
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
    if (!ticket) {
      return undefined
    }
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
    return await bcrypt.hash(password, 10)
  } catch (err) {
    throw new Error('Could not hash password')
  }
}

/**
 * Checks password against the HIBP API.
 * @param password Password to check.
 */
export const checkHibp = async (password: string): Promise<void> => {
  if (REGISTRATION.HIBP_ENABLE && (await pwnedPassword(password))) {
    throw new Error('Password is too weak.')
  }
}

export const rotateTicket = async (ticket: string): Promise<string> => {
  const new_ticket = uuidv4()
  await request(rotateTicketQuery, {
    ticket,
    now: new Date(),
    new_ticket
  })
  return new_ticket
}

export function newRefreshExpiry(): number {
  const now = new Date()
  // 1 day = 1440 minutes
  const days = JWT.REFRESH_EXPIRES_IN / 1440

  return now.setDate(now.getDate() + days)
}

interface InsertRefreshTokenData {
  insert_auth_refresh_tokens_one: {
    account: AccountData
  }
}

export const setRefreshToken = async (
  accountId: string,
  refresh_token = uuidv4()
): Promise<string> => {

  await request<InsertRefreshTokenData>(insertRefreshToken, {
    refresh_token_data: {
      account_id: accountId,
      refresh_token,
      expires_at: new Date(newRefreshExpiry())
    }
  })

  return refresh_token
}

export const accountWithEmailExists = async (email: string) => {
  let account_exists = true
  try {
    await selectAccountByEmail(email)
    // Account using email already exists - pass
  } catch {
    // No existing account is using the email address. Good!
    account_exists = false
  }

  return account_exists
}

export const accountIsAnonymous = async (user_id: string) => {
  const account = await selectAccountByUserId(user_id)

  return account.is_anonymous
}

export const deanonymizeAccount = async (accountId: string, email: string, passwordHash: string) => {
  await request(deanonymizeAccountQuery, {
    account_id: accountId,
    email,
    password_hash: passwordHash,
    default_role: REGISTRATION.DEFAULT_USER_ROLE,
    roles: REGISTRATION.DEFAULT_ALLOWED_USER_ROLES.map(role => ({
      account_id: accountId,
      created_at: new Date(),
      role
    }))
  })
}
