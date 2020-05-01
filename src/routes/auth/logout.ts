import { Request, Response } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { COOKIE_SECRET } from '@shared/config'
import { request } from '@shared/request'
import {
  selectRefreshToken,
  deleteAllAccountRefreshTokens,
  deleteRefreshToken
} from '@shared/queries'
import { logoutSchema } from '@shared/validation'
import { AccountData } from '@shared/types'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function logout({ body, cookies, signedCookies }: Request, res: Response): Promise<unknown> {
  // clear cookie
  res.clearCookie('refresh_token')

  // should we delete all refresh tokens to this user or not
  const { all } = await logoutSchema.validateAsync(body)

  const { refresh_token } = COOKIE_SECRET ? signedCookies : cookies

  if (all) {
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
  } else {
    // if only to delete single refresh token
    try {
      await request(deleteRefreshToken, {
        refresh_token
      })
    } catch (error) {
      return res.status(204).send()
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(logout)
