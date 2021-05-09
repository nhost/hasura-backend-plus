import { Response } from 'express'

import { asyncWrapper } from '@shared/helpers'
import { deleteAccountByUserId } from '@shared/queries'
import { request } from '@shared/request'
import { DeleteAccountData, RequestExtended } from '@shared/types'
import { AUTHENTICATION } from '@shared/config'

async function deleteUser(req: RequestExtended, res: Response): Promise<unknown> {
  if(!AUTHENTICATION.ALLOW_USER_SELF_DELETE) {
    return res.boom.badImplementation(`Please set the ALLOW_USER_SELF_DELETE env variable to true to use the auth/delete route.`)
  }

  if (!req.permission_variables) {
    return res.boom.unauthorized('Unable to delete account')
  }

  const { 'user-id': user_id } = req.permission_variables

  const hasuraData = await request<DeleteAccountData>(deleteAccountByUserId, { user_id })

  if (!hasuraData.delete_auth_accounts.affected_rows) {
    return res.boom.unauthorized('Unable to delete account')
  }

  // clear cookies
  res.clearCookie('refresh_token')
  res.clearCookie('permission_variables')
  return res.status(204).send()
}

export default asyncWrapper(deleteUser)
