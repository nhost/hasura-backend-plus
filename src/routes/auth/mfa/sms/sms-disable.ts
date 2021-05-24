import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Response } from 'express'
import { deleteSmsOtpSecret } from '@shared/queries'

import { authenticator } from 'otplib'
import { smsMfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { AccountData, RequestExtended } from '@shared/types'

async function disableSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  const { code } = await smsMfaSchema.validateAsync(req.body)

  let sms_otp_secret: AccountData['sms_otp_secret']
  let sms_mfa_enabled: AccountData['sms_mfa_enabled']
  try {
    const account = await selectAccountByUserId(user_id)
    sms_otp_secret = account.sms_otp_secret
    sms_mfa_enabled = account.sms_mfa_enabled
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  if (!sms_mfa_enabled) {
    return res.boom.badRequest('SMS MFA is already disabled.')
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!authenticator.check(code, sms_otp_secret!)) {
    return res.boom.unauthorized('Invalid two-factor code.')
  }

  await request(deleteSmsOtpSecret, { user_id })

  return res.status(204).send()
}

export default asyncWrapper(disableSmsMfa)
