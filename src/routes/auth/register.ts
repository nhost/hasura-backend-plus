import { AUTO_ACTIVATE, HIBP_ENABLED, SERVER_URL, SMTP_ENABLED } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, selectUser } from '@shared/helpers'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { emailClient } from '@shared/email'
import { insertUser } from '@shared/queries'
import { pwnedPassword } from 'hibp'
import { registerSchema } from '@shared/schema'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

async function registerUser({ body }: Request, res: Response): Promise<unknown> {
  let password_hash: string

  const { username, email, password } = await registerSchema.validateAsync(body)
  const user = await selectUser(body)

  if (user) {
    throw Boom.badRequest('User is already registered.')
  }

  if (HIBP_ENABLED) {
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

  const ticket = uuidv4()

  try {
    await request(insertUser, {
      user: {
        email,
        ticket,
        username,
        active: AUTO_ACTIVATE,
        user_accounts: {
          data: {
            email,
            username,
            password_hash
          }
        }
      }
    })

    if (!AUTO_ACTIVATE && SMTP_ENABLED) {
      await emailClient
        .send({
          template: 'confirm',
          message: { to: email },
          locals: {
            ticket,
            username,
            url: SERVER_URL
          }
        })
        .catch(console.error)
    }
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(registerUser)
