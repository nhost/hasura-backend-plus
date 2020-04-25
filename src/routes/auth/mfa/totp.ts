import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket, selectAccount } from '@shared/helpers'
import { newJwtExpiry, setRefreshToken, createHasuraJwt } from '@shared/jwt'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { totpSchema } from '@shared/validation'

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

  await setRefreshToken(res, id)
  await rotateTicket(ticket)

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(totpLogin)
