import { REFRESH_TOKEN_EXP, generateJwtToken } from '../utils/helpers'
import { insertRefreshToken, selectUser } from '../utils/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import client from '../utils/client'
import { loginSchema } from '../utils/schema'
import polka from 'polka'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /login
 */
export default polka().post('/', async ({ body }: any, res) => {
  /**
   * Store variables in memory
   */
  let hasura_data: { auth_user_accounts: any[] }

  try {
    /**
     * Validate request body
     */
    const { email, password } = await loginSchema.validateAsync(body)

    /**
     * Query requested user
     */
    try {
      hasura_data = await client.request(selectUser, { email })
    } catch (err) {
      /**
       * Internal server error
       */
      throw Boom.badImplementation()
    }

    if (hasura_data.auth_user_accounts.length === 0) {
      /**
       * Bad request
       */
      throw Boom.badRequest('User does not exist.')
    }

    /**
     * Store user object in a variable
     */
    const user_account = hasura_data.auth_user_accounts[0]

    if (!user_account.user.active) {
      /**
       * Bad request
       */
      throw Boom.badRequest('User not activated.')
    }

    /**
     * Verify password
     */
    try {
      if (!(await argon2.verify(user_account.password, password))) {
        /**
         * Unauthorized
         */
        throw Boom.unauthorized('Password does not match.')
      }
    } catch (err) {
      /**
       * Internal server error
       */
      throw Boom.badImplementation()
    }

    /**
     * Create necessary variables
     */
    const jwt_token = generateJwtToken(user_account.user)
    const refresh_token = uuidv4()

    /**
     * Send request
     */
    try {
      await client.request(insertRefreshToken, {
        refresh_token_data: {
          refresh_token,
          user_id: user_account.user.id,
          expires_at: new Date(new Date().getTime() + REFRESH_TOKEN_EXP * 60 * 1000)
        }
      })
    } catch (err) {
      /**
       * Internal server error
       */
      throw Boom.badImplementation()
    }

    /**
     * Return JSON object
     */
    res.end(JSON.stringify({ refresh_token, jwt_token }))
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
