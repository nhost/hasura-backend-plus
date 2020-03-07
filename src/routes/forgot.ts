import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { async } from '../utils/helpers'
import { client } from '../utils/client'
import { forgotSchema } from '../utils/schema'
import { pwnedPassword } from 'hibp'
import { updatePassword } from '../utils/queries'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /forgot
 */
const forgotHandler = async ({ body }: Request, res: Response) => {
  /**
   * Store variables in memory
   */
  let password_hash: string
  let hasura_data: { update_auth_user_accounts: { affected_rows: number } }

  /**
   * Validate request body
   */
  const { secret_token, password } = await forgotSchema.validateAsync(body)

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
    hasura_data = await client.request(updatePassword, {
      secret_token,
      password_hash,
      now: new Date(),
      new_secret_token: uuidv4()
    })
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  if (hasura_data.update_auth_user_accounts.affected_rows === 0) {
    /**
     * Unauthorized
     */
    throw Boom.unauthorized('Secret token does not match.')
  }

  /**
   * Return 204 No Content
   */
  return res.status(204).send()
}

export default Router().post('/', async(forgotHandler))
