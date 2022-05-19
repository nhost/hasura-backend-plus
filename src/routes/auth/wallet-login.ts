import { Response } from 'express'

import { RequestExtended } from '@shared/types'
import { asyncWrapper } from '@shared/helpers'

const verifySignature = (nonce:string, signature:string, address:string) => {

  return true
}
const getNonceFromCookie = (req: RequestExtended) => {
  return ''
}
async function walletLogin(req: RequestExtended, res: Response): Promise<unknown> {
  // if (!('nonce' in cookiesInUse)) {
  //   return res.boom.badImplementation('Session is expired')
  // }
  if(!verifySignature(getNonceFromCookie(req), req.body.signature, req.body.address))
  {
    return res.boom.badImplementation('Invalid Session')
  }
  return res.send(req.body)
}

export default asyncWrapper(walletLogin)
