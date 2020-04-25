import { Request, Response } from 'express'
import { asyncWrapper, createQR } from '@shared/helpers'

import { OTP_ISSUER } from '@shared/config'
import { authenticator } from 'otplib'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'
import { getClaims } from '@shared/jwt'

async function generateMfa({ headers }: Request, res: Response): Promise<unknown> {
  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

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
