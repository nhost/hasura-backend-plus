import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket, selectAccount, setRefreshToken } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'
import { UserData, Session } from '@shared/types'

import { authenticator } from 'otplib'
import { totpSchema } from '@shared/validation'

// Increase the authenticator window so that TOTP codes from the previous 30 seconds are also valid
authenticator.options = {
  window: [1, 0]
}

async function totpLogin({ body }: Request, res: Response): Promise<any> {
  const { ticket, code } = await totpSchema.validateAsync(body)
  const account = await selectAccount(body)

  if (!account) {
    return res.boom.unauthorized('Invalid or expired ticket.')
  }

  const { id, otp_secret, mfa_enabled, active } = account

  if (!mfa_enabled) {
    return res.boom.badRequest('MFA is not enabled.')
  }

  if (!active) {
    return res.boom.badRequest('Account is not activated.')
  }

  if (!otp_secret) {
    return res.boom.badRequest('OTP secret is not set.')
  }

  if (!authenticator.check(code, otp_secret)) {
    return res.boom.unauthorized('Invalid two-factor code.')
  }

  const refresh_token = await setRefreshToken(id)
  await rotateTicket(ticket)
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry
  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    email: account.email,
    avatar_url: account.user.avatar_url
  }

  const session: Session = { jwt_token, jwt_expires_in, user, refresh_token }

  res.send(session)
}

export default asyncWrapper(totpLogin)
