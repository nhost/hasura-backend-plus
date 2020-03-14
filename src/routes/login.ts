import { Request, Response, Router } from 'express'
import { asyncWrapper, createToken, newJwtExpiry, newRefreshExpiry, signed } from '../utils/helpers'
import { insertRefreshToken, selectUserByEmail } from '../utils/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { client } from '../utils/client'
import { loginSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

const loginHandler = async ({ body }: Request, res: Response) => {
  let hasuraData: { private_user_accounts: any[] }

  const { email, password } = await loginSchema.validateAsync(body)

  try {
    hasuraData = await client(selectUserByEmail, { email })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasuraData.private_user_accounts.length === 0) {
    throw Boom.badRequest('User does not exist.')
  }

  const { user, password_hash } = hasuraData.private_user_accounts[0]

  if (!user.active) {
    throw Boom.badRequest('User not activated.')
  }

  if (!(await argon2.verify(password_hash, password))) {
    throw Boom.unauthorized('Password does not match.')
  }

  const refreshToken = uuidv4()
  const jwtToken = createToken(user.id)

  try {
    await client(insertRefreshToken, {
      refresh_token_data: {
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', refreshToken, {
    signed,
    httpOnly: true,
    maxAge: newRefreshExpiry()
  })

  return res.send({ jwtToken, newJwtExpiry })
}

export default Router().post('/', asyncWrapper(loginHandler))
