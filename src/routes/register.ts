import { Request, Response, Router } from 'express'
import { active, asyncWrapper } from '../utils/helpers'
import { insertUser, selectUserByEmail, selectUserByUsername } from '../utils/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { client } from '../utils/client'
import { pwnedPassword } from 'hibp'
import { registerSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

const registerHandler = async ({ body }: Request, res: Response) => {
  let passwordHash: string

  let hasuraData_1: { private_user_accounts: any[] }
  let hasuraData_2: { private_user_accounts: any[] }

  const { username, email, password } = await registerSchema.validateAsync(body)

  try {
    hasuraData_1 = await client(selectUserByEmail, { email })
    hasuraData_2 = await client(selectUserByUsername, { username })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasuraData_1.private_user_accounts.length !== 0) {
    throw Boom.badRequest('Email is already registered.')
  }

  if (hasuraData_2.private_user_accounts.length !== 0) {
    throw Boom.badRequest('Username is already taken.')
  }

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
    await client(insertUser, {
      user: {
        email,
        active,
        username,
        secret_token: uuidv4(),
        user_accounts: {
          data: {
            email,
            username,
            password_hash: passwordHash
          }
        }
      }
    })
  } catch (err) {
    console.log(err)
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(registerHandler))
