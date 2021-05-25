import { Response, Router } from 'express'
import { deleteAllAccountRefreshTokens } from '@shared/queries'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'
import { asyncWrapper } from '@shared/helpers'

async function revokeToken(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  await request(deleteAllAccountRefreshTokens, { user_id })

  return res.status(204).send()
}

export default (router: Router) => {
  router.post('/revoke', asyncWrapper(revokeToken))
}
