import { Response, Router } from 'express'

import { getJwkStore } from '@shared/jwt'
import { RequestExtended } from '@shared/types'
import { JSONWebKeySet } from 'jose'
import { asyncWrapper } from '@shared/helpers'

const getJwks = async (_req: RequestExtended, res: Response) => {
  let jwks: JSONWebKeySet;
  try {
    jwks = getJwkStore().toJWKS(false)
  } catch (err) {
    return res.boom.notImplemented(err.message)
  }

  return res.send(jwks)
}

export default (router: Router) => {
  router.get('/jwks', asyncWrapper(getJwks))
}
