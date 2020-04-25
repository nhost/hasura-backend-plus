import { Request, Response } from 'express'
import { asyncWrapper, selectAccount } from '@shared/helpers'
import { newJwtExpiry, setRefreshToken, createHasuraJwt } from '@shared/jwt'

import Boom from '@hapi/boom'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@shared/validation'

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

  if (!(await bcrypt.compare(password, password_hash))) {
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
