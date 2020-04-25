import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper, HasuraDeleteAccountData } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { getClaims } from '@shared/jwt'

async function deleteUser({ headers }: Request, res: Response): Promise<unknown> {
  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

  const hasuraData = await request<HasuraDeleteAccountData>(deleteAccountByUserId, { user_id })

  if (!hasuraData.delete_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }

  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
