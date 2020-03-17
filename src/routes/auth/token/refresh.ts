import { Request, Response } from 'express'
import { asyncWrapper, createJwt, newJwtExpiry, newRefreshExpiry, signed } from '@shared/helpers'
import { selectRefreshToken, updateRefreshToken } from '@shared/queries'

import Boom from '@hapi/boom'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

interface HasuraData {
  private_refresh_tokens: [
    {
      user: {
        id: string
      }
    }
  ]
}

async function refresh({ cookies, signedCookies }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { refresh_token } = signed ? signedCookies : cookies

  try {
    hasuraData = (await request(selectRefreshToken, {
      refresh_token,
      current_timestamp: new Date()
    })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const refreshTokens = hasuraData.private_refresh_tokens

  if (!refreshTokens || !refreshTokens.length) {
    throw Boom.unauthorized('Refresh token does not match.')
  }

  const new_refresh_token = uuidv4()
  const { id } = hasuraData.private_refresh_tokens[0].user

  try {
    await request(updateRefreshToken, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        user_id: id,
        refresh_token: new_refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', new_refresh_token, {
    httpOnly: true,
    signed: Boolean(signed),
    maxAge: newRefreshExpiry()
  })

  return res.send({
    jwt_token: createJwt(id),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(refresh)
