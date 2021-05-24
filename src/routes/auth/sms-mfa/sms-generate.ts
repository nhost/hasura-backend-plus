import { Response } from 'express'
import { authenticator } from 'otplib'
import { asyncWrapper } from '@shared/helpers'
import { sendSms } from '@shared/sns'
import { request } from '@shared/request'
import { updateSmsOtpSecretAndPhoneNumber } from '@shared/queries'
import { RequestExtended } from '@shared/types'
import { smsMFaGenerateSchema } from '@shared/validation'

async function generateSmsMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables
  const { phone_number } = await smsMFaGenerateSchema.validateAsync(req.body)

  /**
   * Generate OTP secret and code.
   */
  const sms_otp_secret = authenticator.generateSecret()
  const code = authenticator.generate(sms_otp_secret)

  /**
   * Send SMS with verification code.
   */
  await sendSms(phone_number, code)

  await request(updateSmsOtpSecretAndPhoneNumber, { user_id, sms_otp_secret, phone_number })

  return res.status(204).send()
}

export default asyncWrapper(generateSmsMfa)
