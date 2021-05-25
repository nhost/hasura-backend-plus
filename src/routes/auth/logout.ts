import { Response, Router } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import {
  selectRefreshToken,
  deleteAllAccountRefreshTokens,
  deleteRefreshToken
} from '@shared/queries'
import { LogoutSchema, logoutSchema } from '@shared/validation'
import { AccountData, RequestExtended } from '@shared/types'
import { ValidatedRequestSchema, ContainerTypes, createValidator } from 'express-joi-validation'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function logout({ body, refresh_token }: RequestExtended<Schema>, res: Response): Promise<unknown> {
  if (!refresh_token || !refresh_token.value) {
    return res.boom.unauthorized('Invalid or expired refresh token.')
  }

  // clear cookies
  if (refresh_token.type === 'cookie') {
    res.clearCookie('refresh_token')
    res.clearCookie('permission_variables')
  }

  // should we delete all refresh tokens to this user or not
  const { all } = body

  if (all) {
    // get user based on refresh token
    let hasura_data: HasuraData | null = null
    try {
      hasura_data = await request<HasuraData>(selectRefreshToken, {
        refresh_token: refresh_token.value,
        current_timestamp: new Date()
      })
    } catch (error) {
      return res.status(204).send()
    }

    const account = hasura_data?.auth_refresh_tokens?.[0]?.account

    if (!account) {
      return res.status(204).send()
    }

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
        refresh_token: refresh_token.value
      })
    } catch (error) {
      return res.status(204).send()
    }
  }

  return res.status(204).send()
}

interface Schema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: LogoutSchema
}

export default (router: Router) => {
  router.post('/logout', createValidator().body(logoutSchema), asyncWrapper(logout))
}
