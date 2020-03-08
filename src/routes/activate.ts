import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import { activateSchema } from '../utils/schema'
import { activateUser } from '../utils/queries'
import { async } from '../utils/helpers'
import { client } from '../utils/client'
import { v4 as uuidv4 } from 'uuid'

const activateHandler = async ({ body }: Request, res: Response) => {
  let hasura_data: { update_users: { affected_rows: number } }

  const { secret_token } = await activateSchema.validateAsync(body)

  try {
    hasura_data = await client(activateUser, {
      secret_token,
      now: new Date(),
      new_secret_token: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasura_data.update_users.affected_rows === 0) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default Router().post('/', async(activateHandler))
