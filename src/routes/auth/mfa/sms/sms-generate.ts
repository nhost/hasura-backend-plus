import { authenticator } from 'otplib'
import { Response } from 'express'

import { updateSmsOtpSecretAndPhoneNumber } from '@shared/queries'
import { smsMFaGenerateSchema } from '@shared/validation'
import { RequestExtended } from '@shared/types'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { sendSms } from '@shared/sns'
import { verificationMsg } from '.'

async function generateSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  try {
    const { 'user-id': user_id } = req.permission_variables
    const { phone_number } = await smsMFaGenerateSchema.validateAsync(req.body)

    const sms_otp_secret = authenticator.generateSecret()
    const code = authenticator.generate(sms_otp_secret)

    await sendSms(phone_number, verificationMsg(code))
    await request(updateSmsOtpSecretAndPhoneNumber, { user_id, sms_otp_secret, phone_number })

    return res.status(204).send()
  } catch (err) {
    console.error(err)
    return res.boom.badRequest(err?.message || 'Failed to resend SMS MFA code.')
  }
}

export default asyncWrapper(generateSmsMfa)
