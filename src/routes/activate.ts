import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import { activateSchema } from '../utils/schema'
import { activateUser } from '../utils/queries'
import { async } from '../utils/helpers'
import { client } from '../utils/client'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /activate
 */
const activateHandler = async ({ body }: Request, res: Response) => {
  /**
   * Store variables in memory
   */
  let hasura_data: { update_users: { affected_rows: number } }

  /**
   * Validate request body
   */
  const { secret_token } = await activateSchema.validateAsync(body)

  /**
   * Send request
   */
  try {
    hasura_data = await client.request(activateUser, {
      secret_token,
      now: new Date(),
      new_secret_token: uuidv4()
    })
  } catch (err) {
    /**
     * Internal server error
     */
    throw Boom.badImplementation()
  }

  if (hasura_data.update_users.affected_rows === 0) {
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

export default Router().post('/', async(activateHandler))
