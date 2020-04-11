import { AccountData, asyncWrapper, createHasuraJwt, newRefreshExpiry } from '@shared/helpers'
import { Request, Response } from 'express'
import { selectRefreshToken, updateRefreshToken } from '@shared/queries'

import Boom from '@hapi/boom'
import { COOKIE_SECRET } from '@shared/config'
import { newJwtExpiry, setRefreshToken } from '@shared/jwt'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function refreshToken({ cookies, signedCookies }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { refresh_token } = COOKIE_SECRET ? signedCookies : cookies

  try {
    hasuraData = (await request(selectRefreshToken, {
      refresh_token,
      current_timestamp: new Date()
    })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const refreshTokens = hasuraData.auth_refresh_tokens

  if (!refreshTokens || !refreshTokens.length) {
    throw Boom.unauthorized('Invalid or expired refresh token.')
  }

  const new_refresh_token = uuidv4()
  const { account } = hasuraData.auth_refresh_tokens[0]

  try {
    await request(updateRefreshToken, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        account_id: account.id,
        refresh_token: new_refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  setRefreshToken(res, refresh_token)

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(refreshToken)
