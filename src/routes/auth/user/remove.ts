import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteUserById } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

interface HasuraData {
  delete_private_user_accounts: { affected_rows: number }
  delete_private_refresh_tokens: { affected_rows: number }
  delete_users: { affected_rows: number }
}

async function remove({ headers }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(deleteUserById, { user_id })) as HasuraData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const deleteUsers = hasuraData.delete_users
  const deleteAccounts = hasuraData.delete_private_user_accounts

  const doesNotExist = !deleteAccounts.affected_rows || !deleteUsers.affected_rows

  if (doesNotExist) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }

  return res.status(204).send()
}

export default asyncWrapper(remove)
