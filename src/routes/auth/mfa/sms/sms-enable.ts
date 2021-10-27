import { authenticator } from 'otplib'
import { Response } from 'express'

import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { updateSmsMfaEnabled } from '@shared/queries'
import { smsMfaSchema } from '@shared/validation'
import { RequestExtended } from '@shared/types'
import { request } from '@shared/request'

async function enableSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  try {
    const { 'user-id': user_id } = req.permission_variables
    const { code } = await smsMfaSchema.validateAsync(req.body)
    const { sms_otp_secret, sms_mfa_enabled } = await selectAccountByUserId(user_id)

    if (sms_mfa_enabled) {
      return res.boom.badRequest('SMS MFA is already enabled.')
    }

    if (!sms_otp_secret) {
      return res.boom.badRequest('SMS OTP secret is not set.')
    }

    if (!authenticator.check(code, sms_otp_secret)) {
      return res.boom.unauthorized('Invalid two-factor code.')
    }

    await request(updateSmsMfaEnabled, { user_id, sms_mfa_enabled: true })

    return res.status(204).send()
  } catch (err) {
    return res.boom.badRequest(err?.message || 'Failed to enable SMS MFA')
  }
}

export default asyncWrapper(enableSmsMfa)
