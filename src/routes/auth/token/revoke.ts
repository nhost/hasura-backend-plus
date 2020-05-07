import { Request, Response } from 'express'
import { asyncWrapper, getPermissionVariablesFromCookie } from '@shared/helpers'
import { deleteAllAccountRefreshTokens } from '@shared/queries'
import { request } from '@shared/request'

async function revokeToken(req: Request, res: Response): Promise<unknown> {
  const permission_variables = getPermissionVariablesFromCookie(req)
  const user_id = permission_variables['user-id']

  await request(deleteAllAccountRefreshTokens, { user_id })

  return res.status(204).send()
}

export default asyncWrapper(revokeToken)
