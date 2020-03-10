import {
  JWT_EXPIRES_AT,
  REFRESH_EXPIRES_AT,
  asyncWrapper,
  generateJwtToken
} from '../utils/helpers'
import { Request, Response, Router } from 'express'
import { insertRefreshToken, selectUserByEmail } from '../utils/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { client } from '../utils/client'
import { loginSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

const loginHandler = async ({ body }: Request, res: Response) => {
  let hasura_data: { auth_user_accounts: any[] }

  const { email, password } = await loginSchema.validateAsync(body)

  try {
    hasura_data = await client(selectUserByEmail, { email })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasura_data.auth_user_accounts.length === 0) {
    throw Boom.badRequest('User does not exist.')
  }

  const user_account = hasura_data.auth_user_accounts[0]

  if (!user_account.user.active) {
    throw Boom.badRequest('User not activated.')
  }

  if (!(await argon2.verify(user_account.password, password))) {
    throw Boom.unauthorized('Password does not match.')
  }

  const refresh_token = uuidv4()
  const expires_at = new Date().getTime() + REFRESH_EXPIRES_AT * 60 * 1000

  const jwt_token_expiry = JWT_EXPIRES_AT * 60 * 1000
  const jwt_token = generateJwtToken(user_account.user)

  try {
    await client(insertRefreshToken, {
      refresh_token_data: {
        refresh_token,
        user_id: user_account.user.id,
        expires_at: new Date(expires_at)
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', refresh_token, {
    maxAge: expires_at,
    httpOnly: true
  })

  return res.send({ jwt_token, jwt_token_expiry })
}

export default Router().post('/', asyncWrapper(loginHandler))
