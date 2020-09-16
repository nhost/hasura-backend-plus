import { Response } from 'express'

import { asyncWrapper } from '@shared/helpers'
import { getJwkStore } from '@shared/jwt'
import { RequestExtended } from '@shared/types'

const getJwks = async (_req: RequestExtended, res: Response): Promise<Response<unknown>> =>
  res.send(getJwkStore().toJWKS(false))

export default asyncWrapper(getJwks)
