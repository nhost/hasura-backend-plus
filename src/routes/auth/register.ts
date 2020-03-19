import { Request, Response } from 'express'
import { active, asyncWrapper, selectUser } from '@shared/helpers'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { insertUser } from '@shared/queries'
import { pwnedPassword } from 'hibp'
import { registerSchema } from '@shared/schema'
import { request } from '@shared/request'
// import { sendEmail } from '@shared/email'
import { v4 as uuidv4 } from 'uuid'

async function register({ body }: Request, res: Response): Promise<unknown> {
  let password_hash: string

  const { username, email, password } = await registerSchema.validateAsync(body)
  const user = await selectUser(body)
  if (user) throw Boom.badRequest('User is already registered.')

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

  const ticket = uuidv4()

  try {
    await request(insertUser, {
      user: {
        email,
        active,
        ticket,
        username,
        user_accounts: {
          data: {
            email,
            username,
            password_hash
          }
        }
      }
    })

    /*if (!active) {
      await sendEmail({
        to: email,
        subject: 'Hello World',
        text: `Ticket: ${ticket}`
      })
    }*/
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(register)
