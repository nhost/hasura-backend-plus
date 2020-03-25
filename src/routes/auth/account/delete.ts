import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAccountById } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

interface HasuraData {
  delete_auth_refresh_tokens: { affected_rows: number }
  delete_users: { affected_rows: number }
}

async function deleteUser({ headers }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const decodedToken = verify(headers.authorization)

  const account_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(deleteAccountById, { account_id })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (!hasuraData.delete_users.affected_rows) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }

  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
