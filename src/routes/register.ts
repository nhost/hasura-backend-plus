import Boom from '@hapi/boom'
import argon2 from 'argon2'
import client from '../utils/client'
import { insertUser } from '../utils/queries'
import polka from 'polka'
import { registerSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /register
 */
export default polka().post('/', async ({ body }: any, res) => {
  /**
   * Store variables in memory
   */
  let password_hash: string

  try {
    /**
     * Validate request body
     */
    const { username, email, password } = await registerSchema.validateAsync(body)

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
    return (res.statusCode = 204), res.end()
  } catch (err) {
    /**
     * Set status code
     */
    res.statusCode = err?.output?.statusCode || 400

    /**
     * Return error message
     */
    const error = err?.output?.payload || { message: err?.details[0]?.message }
    return res.end(JSON.stringify(error))
  }
})
