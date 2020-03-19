import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { asyncWrapper } from '@shared/helpers'
import { forgotSchema } from '@shared/schema'
import { pwnedPassword } from 'hibp'
import { v4 as uuidv4 } from 'uuid'
import { request } from '@shared/request'
import { updatePassword } from '@shared/queries'
import { HIBP_ENABLED } from '@shared/config'

interface HasuraData {
  update_private_user_accounts: { affected_rows: number }
}

async function forgot({ body }: Request, res: Response): Promise<unknown> {
  let password_hash: string
  let hasuraData: HasuraData

  const { ticket, new_password } = await forgotSchema.validateAsync(body)

  if (HIBP_ENABLED) {
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
    hasuraData = (await request(updatePassword, {
      ticket,
      password_hash,
      now: new Date(),
      new_ticket: uuidv4()
    })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { affected_rows } = hasuraData.update_private_user_accounts

  if (affected_rows === 0) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  return res.status(204).send()
}

export default asyncWrapper(forgot)
