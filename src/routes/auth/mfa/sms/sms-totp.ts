import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'
import { setRefreshToken } from '@shared/cookies'
import { UserData, Session } from '@shared/types'

import { authenticator } from 'otplib'
import { totpSchema } from '@shared/validation'

// Increase the authenticator window so that TOTP codes from the previous 30 seconds are also valid
authenticator.options = {
  window: [1, 0]
}

async function smsTotpLogin({ body }: Request, res: Response): Promise<unknown> {
  try {
    const { ticket, code } = await totpSchema.validateAsync(body)
    console.log('body: ', body)
    const account = await selectAccount(body)

    if (!account) {
      return res.boom.unauthorized('Invalid or expired ticket.')
    }

    // default to true
    const useCookie = typeof body.cookie !== 'undefined' ? body.cookie : true
    const { id, sms_otp_secret, sms_mfa_enabled, active } = account

    if (!active) {
      return res.boom.unauthorized('Account is not activated.')
    }

    if (!sms_mfa_enabled || !sms_otp_secret) {
      return res.boom.badRequest('MFA is not enabled.')
    }

    if (!authenticator.check(code, sms_otp_secret)) {
      return res.boom.unauthorized('Invalid two-factor code.')
    }

    const refresh_token = await setRefreshToken(res, id, useCookie)
    await rotateTicket(ticket)
    const jwt_token = createHasuraJwt(account)
    const jwt_expires_in = newJwtExpiry

    const user: UserData = {
      id: account.user.id,
      display_name: account.user.display_name,
      email: account.email,
      avatar_url: account.user.avatar_url
    }

    const session: Session = { jwt_token, jwt_expires_in, user }
    if (!useCookie) session.refresh_token = refresh_token

    return res.send(session)
  } catch (err) {
    console.error(err)
    return res.boom.badRequest(err?.message || 'SMS TOTP failed')
  }
}

export default asyncWrapper(smsTotpLogin)
