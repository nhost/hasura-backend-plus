import Boom from '@hapi/boom'
import argon2 from 'argon2'
import client from '../utils/client'
import { forgotSchema } from '../utils/schema'
import polka from 'polka'
import { updatePassword } from '../utils/queries'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /forgot
 */
export default polka().post('/', async ({ body }: any, res) => {
  /**
   * Store variables in memory
   */
  let password_hash: string
  let hasura_data: { update_auth_user_accounts: { affected_rows: number } }

  try {
    /**
     * Validate request body
     */
    const { secret_token, password } = await forgotSchema.validateAsync(body)

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
