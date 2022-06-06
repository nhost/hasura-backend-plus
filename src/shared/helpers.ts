import { COOKIES, REGISTRATION } from './config'
import { NextFunction, Response } from 'express'
import {
  mutateAccountTicket,
  rotateTicket as rotateTicketQuery,
  selectAccountByEmail as selectAccountByEmailQuery,
  selectAccountByTicket as selectAccountByTicketQuery,
  selectAccountByUserId as selectAccountByUserIdQuery,
  selectAccountProvider
} from './queries'

import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { pwnedPassword } from 'hibp'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'
import { AccountData, QueryAccountData, PermissionVariables, RequestExtended, QueryAccountProviderData, AccountProvider, UserData } from './types'
import { bufferToHex } from 'ethereumjs-util'
import { recoverPersonalSignature } from 'eth-sig-util'

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

//generate nonce
export function generateMessageWithNonce(nonce: string) {
  return `You're about to login with your wallet. We just need to create this signature to verify this is your account. This will not charge your wallet. Security code (you can ignore this): ${nonce}`
}

export const getUserDataFromAccount = (account: AccountData) => {

  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    username: account.user.username,
    email: account.email,
    avatar_url: account.user.avatar_url,
    active: account.active,
    wallet:account.account_providers?.find((i)=>i.auth_provider === 'wallet')?.auth_provider_unique_id || ""
  }
  return user
}
export const verifySignature = (req: RequestExtended) => {
  
  const cookiesInUse = COOKIES.SECRET ? req.signedCookies : req.cookies
  if (!('nonce' in cookiesInUse)) {
    return false
  }
  let { nonce } = cookiesInUse
  let {signature, address} = req.body
  let message = generateMessageWithNonce(nonce)
  const msgBufferHex = bufferToHex(Buffer.from(message, 'utf8'));
  const addressFromSignature = recoverPersonalSignature({
    data: msgBufferHex,
    sig: signature,
  })
  return addressFromSignature.toLocaleLowerCase() === address.toLocaleLowerCase()
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

export const selectProviderByWallet = async (address: string): Promise<AccountProvider> => {
  const hasuraData = await request<QueryAccountProviderData>(selectAccountProvider, { provider: "wallet", profile_id: address })
  return hasuraData.auth_account_providers[0]
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
  if (REGISTRATION.HIBP_ENABLED && (await pwnedPassword(password))) {
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

export const updateAccountTicket = async (id: string, ticket: string, ticket_expires_at: Date) => {
  const res = await request<{
    ticket: string
    user: { display_name: string }
  }>(mutateAccountTicket, {
    id,
    ticket,
    ticket_expires_at
  })
  return res
}

export const getPermissionVariablesFromCookie = (req: RequestExtended): PermissionVariables => {
  const { permission_variables } = COOKIES.SECRET ? req.signedCookies : req.cookies
  if (!permission_variables) throw new Error('No permission variables')
  return JSON.parse(permission_variables)
}

export const getEndURLOperator = ({ url }: { url: string }) => {
  return url.includes('?') ? '&' : '?'
}
