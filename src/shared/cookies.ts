import { COOKIE_SECRET, JWT_REFRESH_EXPIRES_IN, COOKIE_SECURE, COOKIE_SAME_SITE } from './config'

import { Response } from 'express'
import { insertRefreshToken } from './queries'
import { request } from './request'
import { v4 as uuidv4 } from 'uuid'
import { AccountData } from './types'
import { generatePermissionVariables } from './jwt'

interface InsertRefreshTokenData {
  insert_auth_refresh_tokens_one: {
    account: AccountData
  }
}

/**
 * New refresh token expiry date.
 */
export function newRefreshExpiry(): number {
  const now = new Date()
  const days = JWT_REFRESH_EXPIRES_IN / 1440

  return now.setDate(now.getDate() + days)
}

/**
 * Set refresh token as a cookie
 * @param res Express Response
 * @param refresh_token Refresh token to be set
 */
export const setCookie = (
  res: Response,
  refresh_token: string,
  permission_variables: string
): void => {
  // converting JWT_REFRESH_EXPIRES_IN from minutes to milliseconds
  const maxAge = JWT_REFRESH_EXPIRES_IN * 60 * 1000

  // set refresh token as cookie
  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIE_SECRET),
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE
  })

  // set permission variables cookie
  res.cookie('permission_variables', permission_variables, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIE_SECRET),
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE
  })
}

/**
 * Insert new refresh token in database and maybe set new refresh token as cookie.
 * @param res Express Response
 * @param accountId Account ID
 * @param useCookie (optional) if the cookie should be set or not
 * @param refresh_token (optional) Refresh token to be set
 */
export const setRefreshToken = async (
  res: Response,
  accountId: string,
  useCookie = false,
  refresh_token?: string
): Promise<string> => {
  if (!refresh_token) {
    refresh_token = uuidv4()
  }

  const insert_account_data = (await request(insertRefreshToken, {
    refresh_token_data: {
      account_id: accountId,
      refresh_token,
      expires_at: new Date(newRefreshExpiry())
    }
  })) as InsertRefreshTokenData

  if (useCookie) {
    const { account } = insert_account_data.insert_auth_refresh_tokens_one
    const permission_variables = JSON.stringify(generatePermissionVariables(account))
    setCookie(res, refresh_token, permission_variables)
  } else {
    res.clearCookie('refresh_token')
    res.clearCookie('permission_variables')
  }

  return refresh_token
}
