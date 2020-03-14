import { Request, Response, Router } from 'express'
import {
  asyncWrapper,
  createJwt,
  newJwtExpiry,
  newRefreshExpiry,
  signed
} from '../../../shared/helpers'
import { selectRefreshToken, updateRefreshToken } from '../../../shared/queries'

import Boom from '@hapi/boom'
import { client } from '../../../shared/client'
import { v4 as uuidv4 } from 'uuid'

const refreshHandler = async ({ cookies, signedCookies }: Request, res: Response) => {
  let hasuraData: { private_refresh_tokens: any[] }

  const { refresh_token } = signed ? signedCookies : cookies

  try {
    hasuraData = await client(selectRefreshToken, {
      refresh_token,
      current_timestamp: new Date()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { user } = hasuraData.private_refresh_tokens[0]

  if (user === undefined) {
    throw Boom.unauthorized('Refresh token does not match.')
  }

  const { id } = user
  const new_refresh_token = uuidv4()

  try {
    await client(updateRefreshToken, {
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

export default Router().post('/', asyncWrapper(refreshHandler))
