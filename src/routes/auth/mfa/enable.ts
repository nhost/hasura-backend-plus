import { HasuraUserData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'
import { selectUserById, updateOtpStatus } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/schema'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function enableMfa({ headers, body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraUserData

  const { code } = await mfaSchema.validateAsync(body)

  const decodedToken = verify(headers.authorization)
  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(selectUserById, { user_id })) as HasuraUserData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { otp_secret, mfa_enabled } = hasuraData.private_user_accounts[0]

  if (mfa_enabled) {
    throw Boom.badRequest('MFA is already enabled.')
  }

  if (!otp_secret) {
    throw Boom.badRequest('OTP secret is not set.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  try {
    await request(updateOtpStatus, { user_id, mfa_enabled: true })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(enableMfa)
