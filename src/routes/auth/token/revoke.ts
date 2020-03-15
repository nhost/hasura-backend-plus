import { Request, Response } from 'express'
import { Token, asyncWrapper, verifyJwt } from '@shared/helpers'

import Boom from '@hapi/boom'
import { deleteRefreshToken } from '@shared/queries'
import { request } from '@shared/request'

async function revoke({ headers }: Request, res: Response) {
  let decodedToken: Token

  try {
    decodedToken = await verifyJwt(headers.authorization!)
  } catch (err) {
    throw Boom.unauthorized()
  }

  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    await request(deleteRefreshToken, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(revoke)
