import { Request, Response } from 'express'
import { asyncWrapper, createHasuraJwt, selectAccount } from '@shared/helpers'
import { newJwtExpiry, setRefreshToken } from '@shared/jwt'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { loginSchema } from '@shared/schema'

async function loginAccount({ body }: Request, res: Response): Promise<unknown> {
  const { password } = await loginSchema.validateAsync(body)

  const account = await selectAccount(body)

  if (!account) {
    throw Boom.badRequest('Account does not exist.')
  }

  const { id, mfa_enabled, password_hash, active, ticket } = account

  if (!active) {
    throw Boom.badRequest('Account is not activated.')
  }

  if (!(await argon2.verify(password_hash, password))) {
    throw Boom.unauthorized('Password does not match.')
  }

  if (mfa_enabled) {
    return res.send({ mfa: true, ticket })
  }

  await setRefreshToken(res, id)

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(loginAccount)
