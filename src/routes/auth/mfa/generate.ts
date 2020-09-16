import { Response } from 'express'
import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { asyncWrapper, createQR } from '@shared/helpers'
import { OTP_ISSUER } from '@shared/config'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'
import { RequestExtended } from '@shared/types'

async function generateMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  /**
   * Generate OTP secret and key URI.
   */
  const otp_secret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user_id, OTP_ISSUER, otp_secret)

  await request(updateOtpSecret, { user_id, otp_secret })

  const image_url = await createQR(otpAuth)

  return res.send({ image_url, otp_secret })
}

export default asyncWrapper(generateMfa)
