import { Request, Response } from 'express'
import { asyncWrapper, createHasuraJwt, newRefreshExpiry, selectAccount } from '@shared/helpers'
import { insertRefreshToken, rotateTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { COOKIE_SECRET } from '@shared/config'
import { authenticator } from 'otplib'
import { newJwtExpiry } from '@shared/jwt'
import { request } from '@shared/request'
import { totpSchema } from '@shared/schema'
import { v4 as uuidv4 } from 'uuid'

async function totpLogin({ body }: Request, res: Response): Promise<unknown> {
  const { ticket, code } = await totpSchema.validateAsync(body)
  const account = await selectAccount(body)

  if (!account) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  const { id, otp_secret, mfa_enabled, active } = account

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is not enabled.')
  }

  if (!active) {
    throw Boom.badRequest('Account is not activated.')
  }

  if (!otp_secret) {
    throw Boom.badRequest('OTP secret is not set.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  const refresh_token = uuidv4()

  try {
    await request(insertRefreshToken, {
      refresh_token_data: {
        account_id: id,
        refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })

    /**
     * Rotate account ticket.
     */
    await request(rotateTicket, {
      ticket,
      now: new Date(),
      new_ticket: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    maxAge: newRefreshExpiry(),
    signed: Boolean(COOKIE_SECRET),
    expires: new Date(newRefreshExpiry())
  })

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(totpLogin)
