import {
  asyncWrapper,
  selectAccountByUserId,
  getPermissionVariablesFromCookie
} from '@shared/helpers'
import { Request, Response } from 'express'
import { updateOtpStatus } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'

async function enableMfa(req: Request, res: Response): Promise<unknown> {
  const { code } = await mfaSchema.validateAsync(req.body)

  const permission_variables = getPermissionVariablesFromCookie(req)
  const user_id = permission_variables['user-id']

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
