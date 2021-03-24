import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Response } from 'express'
import { updateOtpStatus } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'

async function enableMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables
  const { code } = await mfaSchema.validateAsync(req.body)
  const { otp_secret, mfa_enabled } = await selectAccountByUserId(user_id)

  if (mfa_enabled) {
    throw Boom.badRequest('MFA is already enabled.')
  }

  if (!otp_secret) {
    throw Boom.badRequest('OTP secret is not set.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  await request(updateOtpStatus, { user_id, mfa_enabled: true })

  return res.status(204).send()
}

export default asyncWrapper(enableMfa)
