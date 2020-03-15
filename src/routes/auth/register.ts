import { Request, Response } from 'express'
import { active, asyncWrapper } from '@shared/helpers'
import { insertUser, selectUserByEmail, selectUserByUsername } from '@shared/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { pwnedPassword } from 'hibp'
import { registerSchema } from '@shared/schema'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

async function register({ body }: Request, res: Response) {
  let password_hash: string

  let hasuraData_1: { private_user_accounts: any[] }
  let hasuraData_2: { private_user_accounts: any[] }

  const { username, email, password } = await registerSchema.validateAsync(body)

  try {
    hasuraData_1 = await request(selectUserByEmail, { email })
    hasuraData_2 = await request(selectUserByUsername, { username })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { length: length_1 } = hasuraData_1.private_user_accounts

  if (length_1 !== 0) {
    throw Boom.badRequest('Email is already registered.')
  }

  const { length: length_2 } = hasuraData_2.private_user_accounts

  if (length_2 !== 0) {
    throw Boom.badRequest('Username is already taken.')
  }

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
    await request(insertUser, {
      user: {
        email,
        active,
        username,
        ticket: uuidv4(),
        user_accounts: {
          data: {
            email,
            username,
            password_hash
          }
        }
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(register)
