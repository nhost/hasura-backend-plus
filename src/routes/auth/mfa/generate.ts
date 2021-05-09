import { Response } from 'express'
import { authenticator } from 'otplib'
import { asyncWrapper, createQR } from '@shared/helpers'
import { MFA } from '@shared/config'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'
import { RequestExtended } from '@shared/types'

async function generateMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  /**
   * Generate OTP secret and key URI.
   */
  const otp_secret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user_id, MFA.OTP_ISSUER, otp_secret)

  await request(updateOtpSecret, { user_id, otp_secret })

  let image_url: string
  try {
    image_url = await createQR(otpAuth)
  } catch(err) {
    return res.boom.internal(err.message)
  }

  return res.send({ image_url, otp_secret })
}

export default asyncWrapper(generateMfa)
