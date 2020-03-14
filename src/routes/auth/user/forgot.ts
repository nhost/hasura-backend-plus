import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { asyncWrapper } from '../../../shared/helpers'
import { client } from '../../../shared/client'
import { forgotSchema } from '../../../shared/schema'
import { pwnedPassword } from 'hibp'
import { updatePassword } from '../../../shared/queries'
import { v4 as uuidv4 } from 'uuid'

const forgotHandler = async ({ body }: Request, res: Response) => {
  let password_hash: string
  let hasuraData: { update_private_user_accounts: { affected_rows: number } }

  const { ticket, new_password } = await forgotSchema.validateAsync(body)

  if (process.env.HIBP_ENABLED) {
    const pwned = await pwnedPassword(new_password)

    if (pwned) {
      throw Boom.badRequest('Password is too weak.')
    }
  }

  try {
    password_hash = await argon2.hash(new_password)
  } catch (err) {
    throw Boom.badImplementation()
  }

  try {
    hasuraData = await client(updatePassword, {
      ticket,
      password_hash,
      now: new Date(),
      new_ticket: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { affected_rows } = hasuraData.update_private_user_accounts

  if (affected_rows === 0) {
    throw Boom.unauthorized('Secret token does not match.')
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(forgotHandler))
