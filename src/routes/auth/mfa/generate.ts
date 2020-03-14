import { Request, Response, Router } from 'express'
import { Token, asyncWrapper, createQR, verifyJwt } from '../../../shared/helpers'
import { selectUserById, updateOtpSecret } from '../../../shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { client } from '../../../shared/client'

const generateHandler = async ({ headers }: Request, res: Response) => {
  let image_url: string
  let decodedToken: Token

  let hasuraData: { private_user_accounts: any[] }

  try {
    decodedToken = await verifyJwt(headers.authorization)
  } catch (err) {
    throw Boom.unauthorized()
  }

  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = await client(selectUserById, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { OTP_ISSUER = 'Authway' } = process.env
  const { otp_secret } = hasuraData.private_user_accounts[0]

  /**
   * Generate OTP secret and key URI.
   */
  const otpSecret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user_id, OTP_ISSUER, otp_secret)

  try {
    await client(updateOtpSecret, { user_id, otp_secret: otpSecret })
  } catch (err) {
    throw Boom.badImplementation()
  }

  try {
    image_url = await createQR(otpAuth)
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.send({ image_url, otp_secret: otpSecret })
}

export default Router().post('/', asyncWrapper(generateHandler))
