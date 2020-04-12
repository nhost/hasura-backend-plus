import { Request, Response } from 'express'
import { asyncWrapper, createQR } from '@shared/helpers'

import Boom from '@hapi/boom'
import { AUTH_OTP_ISSUER } from '@shared/config'
import { authenticator } from 'otplib'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'
import { verify } from '@shared/jwt'

async function generateMfa({ headers }: Request, res: Response): Promise<unknown> {
  let image_url: string

  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken?.['https://hasura.io/jwt/claims']['x-hasura-user-id'] as string

  /**
   * Generate OTP secret and key URI.
   */
  const otp_secret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user_id, AUTH_OTP_ISSUER, otp_secret)

  try {
    await request(updateOtpSecret, { user_id, otp_secret })
  } catch (err) {
    throw Boom.badImplementation()
  }

  try {
    image_url = (await createQR(otpAuth)) as string
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.send({ image_url, otp_secret })
}

export default asyncWrapper(generateMfa)
