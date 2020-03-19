import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { v4 as uuidv4 } from 'uuid'

import { asyncWrapper, createHasuraJwt, newRefreshExpiry, selectUser } from '@shared/helpers'
import { insertRefreshToken, rotateTicket } from '@shared/queries'
import { newJwtExpiry } from '@shared/jwt'
import { request } from '@shared/request'
import { totpSchema } from '@shared/schema'
import { COOKIE_SECRET } from '@shared/config'

async function totp({ body }: Request, res: Response): Promise<unknown> {
  const { ticket, code } = await totpSchema.validateAsync(body)
  const hasuraUser = await selectUser(body)

  if (!hasuraUser) {
    throw Boom.badRequest('Invalid or expired ticket.')
  }

  const {
    otp_secret,
    mfa_enabled,
    user: { id, active }
  } = hasuraUser

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is not enabled.')
  }

  if (!active) {
    throw Boom.badRequest('User is not activated.')
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
        user_id: id,
        refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })

    /**
     * Rotate user ticket.
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
    signed: Boolean(COOKIE_SECRET),
    maxAge: newRefreshExpiry()
  })

  return res.send({
    jwt_token: createHasuraJwt(hasuraUser),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(totp)
