import { Request, Response, Router } from 'express'

import Boom from '@hapi/boom'
import { activateSchema } from '../utils/schema'
import { activateUser } from '../utils/queries'
import { asyncWrapper } from '../utils/helpers'
import { client } from '../utils/client'
import { v4 as uuidv4 } from 'uuid'

const activateHandler = async ({ body }: Request, res: Response) => {
  let hasuraData: { update_users: { affected_rows: number } }

  const { secretToken } = await activateSchema.validateAsync(body)

  try {
    hasuraData = await client(activateUser, {
      now: new Date(),
      secret_token: secretToken,
      new_secret_token: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (hasuraData.update_users.affected_rows === 0) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(activateHandler))
