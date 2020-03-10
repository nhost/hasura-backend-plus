import {
  JWT_EXPIRES_AT,
  REFRESH_EXPIRES_AT,
  asyncWrapper,
  generateJwtToken
} from '../utils/helpers'
import { Request, Response, Router } from 'express'
import { selectRefreshToken, updateRefreshToken } from '../utils/queries'

import Boom from '@hapi/boom'
import { client } from '../utils/client'
import { refreshSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

const refreshHandler = async ({ body }: Request, res: Response) => {
  let hasura_data: { auth_refresh_tokens: any[] }

  const { refresh_token } = await refreshSchema.validateAsync(body)

  try {
    hasura_data = await client(selectRefreshToken, {
      refresh_token,
      current_timestampz: new Date()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasura_data.auth_refresh_tokens.length === 0) {
    throw Boom.unauthorized('Refresh token does not match.')
  }

  const new_refresh_token = uuidv4()
  const new_expires_at = new Date().getTime() + REFRESH_EXPIRES_AT * 60 * 1000

  const hasura_user = hasura_data.auth_refresh_tokens[0].user

  const jwt_token = generateJwtToken(hasura_user)
  const jwt_token_expiry = JWT_EXPIRES_AT * 60 * 1000

  try {
    await client(updateRefreshToken, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        user_id: hasura_user.id,
        refresh_token: new_refresh_token,
        expires_at: new Date(new_expires_at)
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', new_refresh_token, {
    maxAge: new_expires_at,
    httpOnly: true
  })

  return res.send({ jwt_token, jwt_token_expiry })
}

export default Router().post('/', asyncWrapper(refreshHandler))
