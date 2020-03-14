import { Request, Response, Router } from 'express'
import { Token, asyncWrapper, verifyJwt } from '../../../shared/helpers'

import Boom from '@hapi/boom'
import { client } from '../../../shared/client'
import { deleteRefreshToken } from '../../../shared/queries'

const revokeHandler = async ({ headers }: Request, res: Response) => {
  let decodedToken: Token

  let hasuraData: { private_refresh_tokens: any[] }

  try {
    decodedToken = await verifyJwt(headers.authorization)
  } catch (err) {
    throw Boom.unauthorized()
  }

  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = await client(deleteRefreshToken, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(revokeHandler))
