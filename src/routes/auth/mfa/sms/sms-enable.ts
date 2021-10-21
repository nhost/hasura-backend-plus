import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Response } from 'express'
import { updateOtpStatus } from '@shared/queries'

import { authenticator } from 'otplib'
import { smsMfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { AccountData, RequestExtended } from '@shared/types'

async function enableSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables
  const { code } = await smsMfaSchema.validateAsync(req.body)

  let sms_otp_secret: AccountData['sms_otp_secret']
  let sms_mfa_enabled: AccountData['mfa_enabled']

  try {
    const account = await selectAccountByUserId(user_id)
    sms_otp_secret = account.sms_otp_secret
    sms_mfa_enabled = account.mfa_enabled
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  if (sms_mfa_enabled) {
    return res.boom.badRequest('SMS MFA is already enabled.')
  }

  if (!sms_otp_secret) {
    return res.boom.badRequest('SMS OTP secret is not set.')
  }

  if (!authenticator.check(code, sms_otp_secret)) {
    return res.boom.unauthorized('Invalid two-factor code.')
  }

  await request(updateOtpStatus, { user_id, mfa_enabled: true })

  return res.status(204).send()
}

export default asyncWrapper(enableSmsMfa)
