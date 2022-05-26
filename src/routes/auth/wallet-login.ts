import { Response } from 'express'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'
import { asyncWrapper, getUserDataFromAccount, verifySignature } from '@shared/helpers'
import { getAccountByWalletAddress, setNewTicket } from '@shared/queries'
import { setRefreshToken } from '@shared/cookies'
import { AccountData, Session } from '@shared/types'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { v4 as uuidv4 } from 'uuid'
import { authenticator } from 'otplib'
import { sendSms } from '@shared/sns'
import { verificationMsg } from './mfa/sms'

interface LoginRequest {
  email: string
  username: string
  address: string
  signature: string
}

async function walletLogin(req: RequestExtended, res: Response): Promise<unknown> {
  const useCookie = typeof req.body.cookie !== 'undefined' ? req.body.cookie : true

  if(!verifySignature(req))
  {
    return res.boom.badImplementation('Invalid Session')
  }

  const {address} = req.body as LoginRequest

  const accountResponse = await request<{auth_accounts: AccountData[]}>(getAccountByWalletAddress, {address: address.toLowerCase()})
  let account = null

  if(accountResponse.auth_accounts.length === 0) {

    return res.send()
  } else {
    account = accountResponse.auth_accounts[0]
  }

  const {
    mfa_enabled,
    sms_otp_secret,
    sms_mfa_enabled,
    active,
    email,
    phone_number
  } = account

  if (!active) {
    return res.boom.badRequest('Account is not activated.', {email:email})
  }

  if (mfa_enabled || sms_mfa_enabled) {
    const ticket = uuidv4()
    const ticket_expires_at = new Date(+new Date() + 60 * 60 * 1000)

    // set new ticket
    await request(setNewTicket, {
      user_id: account.user.id,
      ticket,
      ticket_expires_at
    })

    if (sms_mfa_enabled && sms_otp_secret) {
      const code = authenticator.generate(sms_otp_secret)
      await sendSms(phone_number, verificationMsg(code))
      return res.send({ sms_mfa: sms_mfa_enabled, ticket })
    }

    return res.send({ mfa: mfa_enabled, ticket })
  }

  const refresh_token = await setRefreshToken(res, account.id, useCookie)
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry

  const session: Session = { jwt_token, jwt_expires_in, user: getUserDataFromAccount(account) }
  if (useCookie) session.refresh_token = refresh_token

  res.cookie('nonce', null) //empty nonce
console.log("session", session)
  return res.send(session)
}

export default asyncWrapper(walletLogin)
