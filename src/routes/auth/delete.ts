import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper, getPermissionVariablesFromCookie } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { DeleteAccountData } from '@shared/types'

async function deleteUser(req: Request, res: Response): Promise<unknown> {
  const permission_variables = getPermissionVariablesFromCookie(req)
  const user_id = permission_variables['user-id']

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
