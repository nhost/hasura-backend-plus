import { Response } from 'express'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'
import { asyncWrapper } from '@shared/helpers'
import { getAccountByWalletAddress, insertAccount } from '@shared/queries'
import { setRefreshToken } from '@shared/cookies'
import { AccountData, Session } from '@shared/types'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { COOKIES, REGISTRATION } from '@shared/config'
import { v4 as uuidv4 } from 'uuid'


interface LoginRequest {
  address: string
  signature: string
}

const verifySignature = (req: RequestExtended) => {
  const cookiesInUse = COOKIES.SECRET ? req.signedCookies : req.cookies
  if (!('nonce' in cookiesInUse)) {
    return false
  }
  let { nonce } = cookiesInUse
  let {signature, address} = req.body
  console.log("verifySignature", nonce, signature, address)
  return true
}

async function walletLogin(req: RequestExtended, res: Response): Promise<unknown> {
  const useCookie = typeof req.body.cookie !== 'undefined' ? req.body.cookie : true
  
  if(!verifySignature(req))
  {
    return res.boom.badImplementation('Invalid Session')
  }

  const {address} = req.body as LoginRequest

  const accountResponse = await request<{auth_accounts: AccountData[]}>(getAccountByWalletAddress, {address})
  let account = null

  if(accountResponse.auth_accounts.length === 0) {
    const defaultRole = REGISTRATION.DEFAULT_USER_ROLE
    const allowedRoles = REGISTRATION.DEFAULT_ALLOWED_USER_ROLES
    const accountRoles = allowedRoles.map((role: string) => ({ role }))
    const accountId = uuidv4()

    const response = await request<{insert_auth_accounts: AccountData}>(insertAccount, {
      account: {
        id: accountId,
        active: REGISTRATION.AUTO_ACTIVATE_NEW_USERS,
        default_role: defaultRole,
        account_roles: {
          data: accountRoles
        },
        user: {
          data: {}
        },
        account_providers: {
          data: {
            account_id: accountId,
            auth_provider_unique_id: address, 
            auth_provider: "wallet"
          }
        }
      }
    })
    account = response.insert_auth_accounts
  } else {
    account = accountResponse.auth_accounts[0]
  }
  
  const refresh_token = await setRefreshToken(res, account.id, useCookie)
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry
  const session: Session = { jwt_token, jwt_expires_in, user: account.user }
  if (useCookie) session.refresh_token = refresh_token

  return res.send(session)
}

export default asyncWrapper(walletLogin)
