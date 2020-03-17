import { Request, Response } from 'express'
import { asyncWrapper, verifyJwt } from '@shared/helpers'
import { selectUserById, updateOtpStatus } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/schema'
import { request } from '@shared/request'

interface HasuraData {
  private_user_accounts: [{ otp_secret: string; mfa_enabled: boolean }]
}

async function enable({ headers, body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { code } = await mfaSchema.validateAsync(body)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const decodedToken = await verifyJwt(headers.authorization!)
  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(selectUserById, { user_id })) as HasuraData
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

export default asyncWrapper(enable)
