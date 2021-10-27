import { authenticator } from 'otplib'
import { Response } from 'express'

import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { RequestExtended } from '@shared/types'
import { sendSms } from '@shared/sns'
import { verificationMsg } from '.'

async function resendSms(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  try {
    const { 'user-id': user_id } = req.permission_variables
    const { sms_otp_secret, phone_number } = await selectAccountByUserId(user_id)

    if (!sms_otp_secret || !phone_number) {
      return res.boom.badRequest('SMS MFA is not enabled.')
    }

    const code = authenticator.generate(sms_otp_secret)
    await sendSms(phone_number, verificationMsg(code))

    return res.status(204).send()
  } catch (err) {
    return res.boom.badRequest(err?.message || 'Failed to resend SMS MFA code.')
  }
}

export default asyncWrapper(resendSms)
