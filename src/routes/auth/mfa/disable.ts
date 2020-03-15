import { Request, Response } from 'express'
import { Token, asyncWrapper, verifyJwt } from '@shared/helpers'
import { deleteOtpSecret, selectUserById } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/schema'
import { request } from '@shared/request'

async function disable({ headers, body }: Request, res: Response) {
  let decodedToken: Token
  let hasuraData: { private_user_accounts: any[] }

  const { code } = await mfaSchema.validateAsync(body)

  try {
    decodedToken = await verifyJwt(headers.authorization!)
  } catch (err) {
    throw Boom.unauthorized()
  }

  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = await request(selectUserById, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { otp_secret, mfa_enabled } = hasuraData.private_user_accounts[0]

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is already disabled.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  try {
    hasuraData = await request(deleteOtpSecret, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(disable)
