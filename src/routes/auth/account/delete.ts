import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

interface HasuraData {
  delete_auth_accounts: { affected_rows: number }
}

async function deleteUser({ headers }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken?.['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(deleteAccountByUserId, { user_id })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (!hasuraData.delete_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }

  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
