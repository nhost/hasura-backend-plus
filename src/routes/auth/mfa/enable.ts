import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { Response } from 'express'
import { updateOtpStatus } from '@shared/queries'

import { authenticator } from 'otplib'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'
import { AccountData, RequestExtended } from '@shared/types'

async function enableMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables
  const { code } = await mfaSchema.validateAsync(req.body)

  let otp_secret: AccountData['otp_secret']
  let mfa_enabled: AccountData['mfa_enabled']
  try {
    const account = await selectAccountByUserId(user_id)
    otp_secret = account.otp_secret
    mfa_enabled = account.mfa_enabled
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  if (mfa_enabled) {
    return res.boom.badRequest('MFA is already enabled.')
  }

  if (!otp_secret) {
    return res.boom.badRequest('OTP secret is not set.')
  }

  if (!authenticator.check(code, otp_secret)) {
    return res.boom.unauthorized('Invalid two-factor code.')
  }

  await request(updateOtpStatus, { user_id, mfa_enabled: true })

  return res.status(204).send()
}

export default asyncWrapper(enableMfa)
