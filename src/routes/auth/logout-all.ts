import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { COOKIE_SECRET } from '@shared/config'
import { request } from '@shared/request'
import { selectRefreshToken, deleteAllAccountRefreshTokens } from '@shared/queries'
import { AccountData } from '@shared/types'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function logoutAll({ cookies, signedCookies }: Request, res: Response): Promise<Response> {
  // clear cookie
  // We will always return 204 on early exits
  // most important thing is to clear the cookie and try do delete all refresh tokens
  res.clearCookie('refresh_token')

  // get refresh token
  const { refresh_token } = COOKIE_SECRET ? signedCookies : cookies

  // get user based on refresh token
  let hasura_data: HasuraData | null = null
  try {
    hasura_data = await request<HasuraData>(selectRefreshToken, {
      refresh_token,
      current_timestamp: new Date()
    })
  } catch (error) {
    return res.status(204).send()
  }

  if (!hasura_data) {
    return res.status(204).send()
  }

  const { auth_refresh_tokens } = hasura_data

  // if no accounts found
  if (!auth_refresh_tokens.length) {
    return res.status(204).send()
  }

  // get logged out account
  const { account } = auth_refresh_tokens[0]

  // delete all refresh tokens for user
  try {
    await request(deleteAllAccountRefreshTokens, {
      user_id: account.user.id
    })
  } catch (error) {
    return res.status(204).send()
  }

  return res.status(204).send()
}

export default asyncWrapper(logoutAll)
