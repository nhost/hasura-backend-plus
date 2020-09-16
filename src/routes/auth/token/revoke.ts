import { Response } from 'express'
import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { deleteAllAccountRefreshTokens } from '@shared/queries'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'

async function revokeToken(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  await request(deleteAllAccountRefreshTokens, { user_id })

  return res.status(204).send()
}

export default asyncWrapper(revokeToken)
