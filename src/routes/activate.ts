import Boom from '@hapi/boom'
import { activateSchema } from '../utils/schema'
import { activateUser } from '../utils/queries'
import client from '../utils/client'
import polka from 'polka'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /activate
 */
export default polka().post('/', async ({ body }: any, res) => {
  /**
   * Store variables in memory
   */
  let hasura_data: { update_users: { affected_rows: number } }

  try {
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

      console.log(hasura_data)
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
