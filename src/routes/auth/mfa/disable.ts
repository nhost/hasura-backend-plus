import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Response } from 'express'
import { deleteOtpSecret } from '@shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'

async function disableMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  const { code } = await mfaSchema.validateAsync(req.body)
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
