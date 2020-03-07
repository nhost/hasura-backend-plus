import { REFRESH_EXPIRES_AT, async, generateJwtToken } from '../utils/helpers'
import { Request, Response, Router } from 'express'
import { selectRefreshToken, updateRefreshToken } from '../utils/queries'

import Boom from '@hapi/boom'
import { client } from '../utils/client'
import { refreshSchema } from '../utils/schema'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /refresh
 */
const refreshHandler = async ({ body }: Request, res: Response) => {
  /**
   * Store variables in memory
   */
  let hasura_data: { auth_refresh_tokens: any[] }

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
  const new_expires_at = new Date(new Date().getTime() + REFRESH_EXPIRES_AT * 60 * 1000)

  /**
   * Send request
   */
  try {
    await client.request(updateRefreshToken, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        user_id: hasura_user.id,
        expires_at: new_expires_at,
        refresh_token: new_refresh_token
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
  return res.send({ refresh_token: new_refresh_token, jwt_token })
}

export default Router().post('/', async(refreshHandler))
