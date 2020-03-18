import { Request, Response } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { getJwkStore } from '@shared/jwt'

const jwks = async (_req: Request, res: Response): Promise<Response<unknown>> =>
  res.send(getJwkStore().toJWKS(false))

export default asyncWrapper(jwks)
