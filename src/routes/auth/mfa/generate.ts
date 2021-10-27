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

  try {
    const { 'user-id': user_id } = req.permission_variables
    const otp_secret = authenticator.generateSecret()
    const otpAuth = authenticator.keyuri(user_id, MFA.OTP_ISSUER, otp_secret)

    await request(updateOtpSecret, { user_id, otp_secret })

    const image_url = await createQR(otpAuth)

    return res.send({ image_url, otp_secret })
  } catch (err) {
    console.error(err)
    return res.boom.internal(err.message)
  }
}

export default asyncWrapper(generateMfa)
