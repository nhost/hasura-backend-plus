import { HasuraAccountData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'
import { deleteOtpSecret, selectAccountById } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/schema'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function disableMfa({ headers, body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraAccountData

  const { code } = await mfaSchema.validateAsync(body)

  const decodedToken = verify(headers.authorization)
  const account_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = (await request(selectAccountById, { account_id })) as HasuraAccountData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { otp_secret, mfa_enabled } = hasuraData.auth_accounts[0]

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is already disabled.')
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!authenticator.check(code, otp_secret!)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  try {
    hasuraData = (await request(deleteOtpSecret, { account_id })) as HasuraAccountData
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(disableMfa)
