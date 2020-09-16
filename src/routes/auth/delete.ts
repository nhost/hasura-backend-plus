import { Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { DeleteAccountData, RequestExtended } from '@shared/types'

async function deleteUser(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Unable to delete account')
  }

  const { 'user-id': user_id } = req.permission_variables

  const hasuraData = await request<DeleteAccountData>(deleteAccountByUserId, { user_id })

  if (!hasuraData.delete_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Unable to delete account')
  }

  // clear cookies
  res.clearCookie('refresh_token')
  res.clearCookie('permission_variables')
  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
