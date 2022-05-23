import { Request, Response } from 'express'
import { authenticator } from 'otplib'

import { asyncWrapper, rotateTicket, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'
import { setRefreshToken } from '@shared/cookies'
import { UserData, Session } from '@shared/types'
import { totpSchema } from '@shared/validation'

async function totpLogin({ body }: Request, res: Response): Promise<unknown> {
  try {
    const { ticket, code } = await totpSchema.validateAsync(body)
    const account = await selectAccount(body)

    if (!account) {
      return res.boom.unauthorized('Invalid or expired ticket.')
    }

    // default to true
    const useCookie = typeof body.cookie !== 'undefined' ? body.cookie : true
    const { id, otp_secret, mfa_enabled, active } = account

    if (!active) {
      return res.boom.unauthorized('Account is not activated.')
    }

    if (!mfa_enabled || !otp_secret) {
      return res.boom.badRequest('MFA is not enabled.')
    }

    if (!authenticator.check(code, otp_secret)) {
      return res.boom.unauthorized('Invalid two-factor code.')
    }

    const refresh_token = await setRefreshToken(res, id, useCookie)
    await rotateTicket(ticket)
    const jwt_token = createHasuraJwt(account)
    const jwt_expires_in = newJwtExpiry

    const user: UserData = {
      id: account.user.id,
      display_name: account.user.display_name,
      username: account.user.username,
      email: account.email,
      avatar_url: account.user.avatar_url
    }

    const session: Session = { jwt_token, jwt_expires_in, user }
    if (!useCookie) session.refresh_token = refresh_token

    return res.send(session)
  } catch (err) {
    return res.boom.badRequest(err?.message || 'TOTP failed')
  }
}

export default asyncWrapper(totpLogin)
