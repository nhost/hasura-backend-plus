import { authenticator } from 'otplib'
import { Response } from 'express'

import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { deleteSmsOtpSecret } from '@shared/queries'
import { RequestExtended } from '@shared/types'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'

async function disableSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  try {
    const { 'user-id': user_id } = req.permission_variables
    const { code } = await mfaSchema.validateAsync(req.body)
    const { sms_otp_secret, sms_mfa_enabled } = await selectAccountByUserId(user_id)

    if (!sms_mfa_enabled || !sms_otp_secret) {
      return res.boom.badRequest('SMS MFA is already disabled.')
    }

    if (!authenticator.check(code, sms_otp_secret)) {
      return res.boom.unauthorized('Invalid two-factor code.')
    }

    await request(deleteSmsOtpSecret, { user_id })

    return res.status(204).send()
  } catch (err) {
    return res.boom.badRequest(err?.message || 'Failed to disable MFA')
  }
}

export default asyncWrapper(disableSmsMfa)
