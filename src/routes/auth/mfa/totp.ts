import { Request, Response, Router } from 'express'
import {
  asyncWrapper,
  createJwt,
  newJwtExpiry,
  newRefreshExpiry,
  signed
} from '../../../shared/helpers'
import { insertRefreshToken, selectUserByTicket } from '../../../shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { client } from '../../../shared/client'
import { totpSchema } from '../../../shared/schema'
import { v4 as uuidv4 } from 'uuid'

const totpHandler = async ({ body }: Request, res: Response) => {
  let hasuraData: { private_user_accounts: any[] }

  const { ticket, code } = await totpSchema.validateAsync(body)

  try {
    hasuraData = await client(selectUserByTicket, { ticket })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { user, mfa_enabled, otp_secret } = hasuraData.private_user_accounts[0]

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is not enabled.')
  }

  if (!user.active) {
    throw Boom.badRequest('User not activated.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  const { id } = user
  const refresh_token = uuidv4()

  try {
    await client(insertRefreshToken, {
      refresh_token_data: {
        user_id: id,
        refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    signed: Boolean(signed),
    maxAge: newRefreshExpiry()
  })

  return res.send({
    jwt_token: createJwt(id),
    jwt_expires_in: newJwtExpiry
  })
}

export default Router().post('/', asyncWrapper(totpHandler))
