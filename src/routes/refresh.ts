import { Request, Response, Router } from 'express'
import { asyncWrapper, createToken, newJwtExpiry, newRefreshExpiry, signed } from '../utils/helpers'
import { selectRefreshToken, updateRefreshToken } from '../utils/queries'

import Boom from '@hapi/boom'
import { client } from '../utils/client'
import { v4 as uuidv4 } from 'uuid'

const refreshHandler = async ({ cookies, signedCookies }: Request, res: Response) => {
  let hasuraData: { private_refresh_tokens: any[] }

  const { refreshToken } = signed ? signedCookies : cookies

  try {
    hasuraData = await client(selectRefreshToken, {
      refresh_token: refreshToken,
      current_timestampz: new Date()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasuraData.private_refresh_tokens.length === 0) {
    throw Boom.unauthorized('Refresh token does not match.')
  }

  const { id } = hasuraData.private_refresh_tokens[0].user

  const newRefreshToken = uuidv4()
  const jwtToken = createToken(id)

  try {
    await client(updateRefreshToken, {
      old_refresh_token: refreshToken,
      new_refresh_token_data: {
        user_id: id,
        refresh_token: newRefreshToken,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', newRefreshToken, {
    signed,
    httpOnly: true,
    maxAge: newRefreshExpiry()
  })

  return res.send({ jwtToken, newJwtExpiry })
}

export default Router().post('/', asyncWrapper(refreshHandler))
