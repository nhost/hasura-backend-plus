import { Request, Response } from 'express'
import { asyncWrapper, createJwt, newJwtExpiry, newRefreshExpiry, signed } from '@shared/helpers'
import { insertRefreshToken, selectUserByEmail } from '@shared/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { loginSchema } from '@shared/schema'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

async function login({ body }: Request, res: Response) {
  let hasuraData: { private_user_accounts: any[] }

  const { email, password } = await loginSchema.validateAsync(body)

  try {
    hasuraData = await request(selectUserByEmail, { email })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const hasuraUser: {
    user: {
      id: string
      ticket: string
      active: boolean
    }
    mfa_enabled: boolean
    password_hash: string
  }[] = hasuraData.private_user_accounts

  if (hasuraUser.length === 0) {
    throw Boom.badRequest('User does not exist.')
  }

  const {
    mfa_enabled,
    password_hash,
    user: { id, active, ticket }
  } = hasuraUser[0]

  if (mfa_enabled) {
    return res.send({ mfa: true, ticket })
  }

  if (!active) {
    throw Boom.badRequest('User not activated.')
  }

  if (!(await argon2.verify(password_hash, password))) {
    throw Boom.unauthorized('Password does not match.')
  }

  const refresh_token = uuidv4()

  try {
    await request(insertRefreshToken, {
      refresh_token_data: {
        user_id: id,
        refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    signed: Boolean(signed),
    maxAge: newRefreshExpiry()
  })

  return res.send({
    jwt_token: createJwt(id),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(login)
