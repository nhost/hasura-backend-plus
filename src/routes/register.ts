import { Request, Response, Router } from 'express'
import { insertUser, selectUserByEmail, selectUserByUsername } from '../utils/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { async } from '../utils/helpers'
import { client } from '../utils/client'
import { pwnedPassword } from 'hibp'
import { registerSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /register
 */
const registerHandler = async ({ body }: Request, res: Response) => {
  /**
   * Store variables in memory
   */
  let password_hash: string
  let hasura_data_1: { auth_user_accounts: any[] }
  let hasura_data_2: { auth_user_accounts: any[] }

  /**
   * Validate request body
   */
  const { username, email, password } = await registerSchema.validateAsync(body)

  /**
   * Query requested user by email
   */
  try {
    hasura_data_1 = await client.request(selectUserByEmail, { email })
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  /**
   * Query requested user by username
   */
  try {
    hasura_data_2 = await client.request(selectUserByUsername, { username })
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  if (hasura_data_1.auth_user_accounts.length !== 0) {
    /**
     * Bad request
     */
    throw Boom.badRequest('Email is already registered.')
  }

  if (hasura_data_2.auth_user_accounts.length !== 0) {
    /**
     * Bad request
     */
    throw Boom.badRequest('Username is already taken.')
  }

  /**
   * Check against the HIBP API
   */
  if (process.env.HIBP_ENABLED) {
    /**
     * Check for pwnage
     */
    const pwned = await pwnedPassword(password)

    /**
     * Oh no — pwned!
     */
    if (pwned) {
      throw Boom.badRequest('Password is too weak.')
    }
  }

  /**
   * Hash password
   */
  try {
    password_hash = await argon2.hash(password)
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  /**
   * Send request
   */
  try {
    await client.request(insertUser, {
      user: {
        email,
        secret_token: uuidv4(),
        user_accounts: {
          data: { email, username, password: password_hash }
        }
      }
    })
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  /**
   * Return 204 No Content
   */
  return res.status(204).send()
}

export default Router().post('/', async(registerHandler))
