import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteRefreshToken } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function revokeToken({ headers }: Request, res: Response): Promise<unknown> {
  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    await request(deleteRefreshToken, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(revokeToken)
