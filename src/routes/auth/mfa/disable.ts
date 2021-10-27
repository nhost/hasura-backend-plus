import { authenticator } from 'otplib'
import { Response } from 'express'
import { asyncWrapper, selectAccountByUserId } from '@shared/helpers'
import { deleteOtpSecret } from '@shared/queries'
import { RequestExtended } from '@shared/types'
import { mfaSchema } from '@shared/validation'
import { request } from '@shared/request'

async function disableMfa(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  try {
    const { 'user-id': user_id } = req.permission_variables
    const { code } = await mfaSchema.validateAsync(req.body)
    const { otp_secret, mfa_enabled } = await selectAccountByUserId(user_id)

    if (!mfa_enabled || !otp_secret) {
      return res.boom.badRequest('MFA is already disabled.')
    }

    if (!authenticator.check(code, otp_secret)) {
      return res.boom.unauthorized('Invalid two-factor code.')
    }

    await request(deleteOtpSecret, { user_id })

    return res.status(204).send()
  } catch (err) {
    return res.boom.badRequest(err?.message || 'Failed to disable MFA')
  }

}

export default asyncWrapper(disableMfa)
