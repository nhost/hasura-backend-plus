import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { async } from '../utils/helpers'
import { client } from '../utils/client'
import { forgotSchema } from '../utils/schema'
import { pwnedPassword } from 'hibp'
import { updatePassword } from '../utils/queries'
import { v4 as uuidv4 } from 'uuid'

const forgotHandler = async ({ body }: Request, res: Response) => {
  let password_hash: string
  let hasura_data: { update_auth_user_accounts: { affected_rows: number } }

  const { secret_token, password } = await forgotSchema.validateAsync(body)

  if (process.env.HIBP_ENABLED) {
    const pwned = await pwnedPassword(password)

    if (pwned) {
      throw Boom.badRequest('Password is too weak.')
    }
  }

  try {
    password_hash = await argon2.hash(password)
  } catch (err) {
    throw Boom.badImplementation()
  }

  try {
    hasura_data = await client(updatePassword, {
      secret_token,
      password_hash,
      now: new Date(),
      new_secret_token: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasura_data.update_auth_user_accounts.affected_rows === 0) {
    throw Boom.unauthorized('Secret token does not match.')
  }

  return res.status(204).send()
}

export default Router().post('/', async(forgotHandler))
