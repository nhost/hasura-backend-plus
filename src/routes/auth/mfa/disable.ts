import { HasuraUserData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'
import { deleteOtpSecret, selectUserById } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/schema'
import { request } from '@shared/request'
import { verify } from '@shared/jwt'

async function disableMfa({ headers, body }: Request, res: Response): Promise<unknown> {
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

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is already disabled.')
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!authenticator.check(code, otp_secret!)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  try {
    hasuraData = (await request(deleteOtpSecret, { user_id })) as HasuraUserData
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(disableMfa)
