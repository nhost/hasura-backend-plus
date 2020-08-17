import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'
import { setRefreshToken } from '@shared/cookies'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { totpSchema } from '@shared/validation'

async function totpLogin({ body }: Request, res: Response): Promise<void> {
  const { ticket, code } = await totpSchema.validateAsync(body)
  const account = await selectAccount(body)

  // default to true
  const useCookie = typeof body.cookie !== 'undefined' ? body.cookie : true

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

  const refresh_token = await setRefreshToken(res, id, useCookie)
  await rotateTicket(ticket)
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry

  // return
  if (useCookie) {
    res.send({
      jwt_token,
      jwt_expires_in
    })
  } else {
    res.send({
      jwt_token,
      jwt_expires_in,
      refresh_token
    })
  }
}

export default asyncWrapper(totpLogin)
