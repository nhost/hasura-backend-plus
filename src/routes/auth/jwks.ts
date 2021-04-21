import { Response } from 'express'

import { asyncWrapper } from '@shared/helpers'
import { getJwkStore } from '@shared/jwt'
import { RequestExtended } from '@shared/types'
import { JSONWebKeySet } from 'jose'

const getJwks = async (_req: RequestExtended, res: Response) => {
  let jwks: JSONWebKeySet;
  try {
    jwks = getJwkStore().toJWKS(false)
  } catch (err) {
    return res.boom.notImplemented(err.message)
  }

  return res.send(jwks)
}

export default asyncWrapper(getJwks)
