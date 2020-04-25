import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Request, Response } from 'express'
import { deleteOtpSecret } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { getClaims } from '@shared/jwt'

async function disableMfa({ headers, body }: Request, res: Response): Promise<unknown> {
  const { code } = await mfaSchema.validateAsync(body)

  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

  const { otp_secret, mfa_enabled } = await selectAccountByUserId(user_id)

  if (!mfa_enabled) {
    throw Boom.badRequest('MFA is already disabled.')
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!authenticator.check(code, otp_secret!)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  await request(deleteOtpSecret, { user_id })

  return res.status(204).send()
}

export default asyncWrapper(disableMfa)
