import { Request, Response } from 'express'
import { asyncWrapper, createQR, getPermissionVariablesFromCookie } from '@shared/helpers'
import { OTP_ISSUER } from '@shared/config'
import { authenticator } from 'otplib'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'

async function generateMfa(req: Request, res: Response): Promise<unknown> {
  const permission_variables = getPermissionVariablesFromCookie(req)
  const user_id = permission_variables['user-id']

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
