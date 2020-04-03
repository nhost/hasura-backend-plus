import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAllAccountRefreshTokens } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function revokeToken({ headers }: Request, res: Response): Promise<unknown> {
  const decodedToken = verify(headers.authorization)
  const account_id = decodedToken?.['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    await request(deleteAllAccountRefreshTokens, { account_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(revokeToken)
