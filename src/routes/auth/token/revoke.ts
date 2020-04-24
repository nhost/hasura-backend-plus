import { Request, Response } from 'express'

import { asyncWrapper } from '@shared/helpers'
import { deleteAllAccountRefreshTokens } from '@shared/queries'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function revokeToken({ headers }: Request, res: Response): Promise<unknown> {
  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken?.['https://hasura.io/jwt/claims']['x-hasura-user-id']

  await request(deleteAllAccountRefreshTokens, { user_id })

  return res.status(204).send()
}

export default asyncWrapper(revokeToken)
