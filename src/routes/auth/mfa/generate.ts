import { Request, Response } from 'express'
import { asyncWrapper, createQR } from '@shared/helpers'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { request } from '@shared/request'
import { updateOtpSecret } from '@shared/queries'
import { verify } from '@shared/jwt'

async function generate({ headers }: Request, res: Response): Promise<unknown> {
  let image_url: string

  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  const { OTP_ISSUER = 'HBP' } = process.env

  /**
   * Generate OTP secret and key URI.
   */
  const otp_secret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user_id, OTP_ISSUER, otp_secret)

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

export default asyncWrapper(generate)
