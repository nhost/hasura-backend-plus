import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { getClaims } from '@shared/jwt'
import { DeleteAccountData } from '@shared/types'

async function deleteUser({ headers }: Request, res: Response): Promise<unknown> {
  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

  const hasuraData = await request<DeleteAccountData>(deleteAccountByUserId, { user_id })

  if (!hasuraData.delete_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired JWT token.')
  }

  // clear cookie
  res.clearCookie('refresh_token')
  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
