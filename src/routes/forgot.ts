import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { asyncWrapper } from '../utils/helpers'
import { client } from '../utils/client'
import { forgotSchema } from '../utils/schema'
import { pwnedPassword } from 'hibp'
import { updatePassword } from '../utils/queries'
import { v4 as uuidv4 } from 'uuid'

const forgotHandler = async ({ body }: Request, res: Response) => {
  let passwordHash: string

  let hasuraData: { update_private_user_accounts: { affected_rows: number } }

  const { secretToken, password } = await forgotSchema.validateAsync(body)

  if (process.env.HIBP_ENABLED) {
    const pwned = await pwnedPassword(password)

    if (pwned) {
      throw Boom.badRequest('Password is too weak.')
    }
  }

  try {
    passwordHash = await argon2.hash(password)
  } catch (err) {
    throw Boom.badImplementation()
  }

  try {
    hasuraData = await client(updatePassword, {
      now: new Date(),
      secret_token: secretToken,
      new_secret_token: uuidv4(),
      password_hash: passwordHash
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasuraData.update_private_user_accounts.affected_rows === 0) {
    throw Boom.unauthorized('Secret token does not match.')
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(forgotHandler))
