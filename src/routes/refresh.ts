import { REFRESH_TOKEN_EXP, generateJwtToken } from '../utils/helpers'
import { selectRefreshToken, updateRefreshToken } from '../utils/queries'

import Boom from '@hapi/boom'
import client from '../utils/client'
import polka from 'polka'
import { refreshSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /refresh
 */
export default polka().post('/', async ({ body }: any, res) => {
  /**
   * Store variables in memory
   */
  let hasura_data: { auth_refresh_tokens: any[] }

  try {
    /**
     * Validate request body
     */
    const { refresh_token } = await refreshSchema.validateAsync(body)

    /**
     * Send request
     */
    try {
      hasura_data = await client.request(selectRefreshToken, {
        refresh_token,
        current_timestampz: new Date()
      })
    } catch (err) {
      /**
       * Internal server error
       */
      throw Boom.badImplementation()
    }

    if (hasura_data.auth_refresh_tokens.length === 0) {
      /**
       * Unauthorized
       */
      throw Boom.unauthorized('Refresh token does not match.')
    }

    /**
     * Create necessary variables
     */
    const new_refresh_token = uuidv4()
    const hasura_user = hasura_data.auth_refresh_tokens[0].user
    const new_refresh_token_exp = new Date(new Date().getTime() + REFRESH_TOKEN_EXP * 60 * 1000)

    /**
     * Send request
     */
    try {
      await client.request(updateRefreshToken, {
        old_refresh_token: refresh_token,
        new_refresh_token_data: {
          user_id: hasura_user.id,
          refresh_token: new_refresh_token,
          expires_at: new_refresh_token_exp
        }
      })
    } catch (err) {
      /**
       * Internal server error
       */
      throw Boom.badImplementation()
    }

    /**
     * Generate a new JWT token
     */
    const jwt_token = generateJwtToken(hasura_user)

    /**
     * Return JSON object
     */
    res.end(JSON.stringify({ refresh_token: new_refresh_token, jwt_token }))
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
