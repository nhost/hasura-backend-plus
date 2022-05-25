import { Response, Request } from 'express'
import crypto from 'crypto'

import { asyncWrapper, generateMessageWithNonce } from '@shared/helpers'
import { COOKIES } from '@shared/config';


async function getNonce(req: Request, res: Response): Promise<unknown> {
  
  let nonce = crypto.randomBytes(16).toString('hex')
  // let { address } = req.body
  let maxAge  = 15 * 60 * 1000 //15 minutes
  res.cookie('nonce', nonce, {
    httpOnly: true,
    maxAge,
    signed: Boolean(COOKIES.SECRET),
    sameSite: COOKIES.SAME_SITE,
    secure: COOKIES.SECURE
  })

  return res.send(generateMessageWithNonce(nonce))
}

export default asyncWrapper(getNonce)
