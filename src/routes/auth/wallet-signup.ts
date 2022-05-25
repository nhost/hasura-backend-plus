import { Response } from 'express'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'
import { asyncWrapper, selectAccount, verifySignature } from '@shared/helpers'
import { getAccountByWalletAddress,  insertAccountProviderWithUserAccount, setWallet } from '@shared/queries'
import { setRefreshToken } from '@shared/cookies'
import { AccountData, Session } from '@shared/types'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { APPLICATION, AUTHENTICATION, REGISTRATION } from '@shared/config'
import { emailClient } from '@shared/email'
import { v4 as uuidv4 } from 'uuid'


interface SignUpRequest {
  email: string
  username: string
  address: string
  signature: string
}
async function walletSignup(req: RequestExtended, res: Response): Promise<unknown> {
  const useCookie = typeof req.body.cookie !== 'undefined' ? req.body.cookie : true
 
  if(!verifySignature(req))
  {
    return res.boom.badImplementation('Invalid Session')
  }

  const {address, email, username} = req.body as SignUpRequest
  
  const next_url = req.body.next_url as string

  //check if email already exists
  const selectedAccount = await selectAccount(req.body)
  if (selectedAccount) {
    if (!selectedAccount.active) {
      return res.boom.badRequest('Email already exists but is not activated.')
    }
    return res.boom.badRequest('Email already exists.')
  }
  
  let account = null

  const ticket = uuidv4()
  const ticket_expires_at = new Date(+new Date() + 60 * 60 * 1000).toISOString()
  
  try {
    const accountResponse = await request<{auth_accounts: AccountData[]}>(getAccountByWalletAddress, {address})
  


    if(accountResponse.auth_accounts.length === 0) {
      const defaultRole = REGISTRATION.DEFAULT_USER_ROLE
      const allowedRoles = REGISTRATION.DEFAULT_ALLOWED_USER_ROLES
      const accountRoles = allowedRoles.map((role: string) => ({ role }))
    
      const response = await request<{insert_auth_account_providers_one: {account:AccountData}}>(insertAccountProviderWithUserAccount, {
        account_provider: {
          auth_provider_unique_id: address, 
          auth_provider: "wallet",
          account: {
            data: {
              email: email,
              ticket:ticket,
              ticket_expires_at:ticket_expires_at,
              active: REGISTRATION.AUTO_ACTIVATE_NEW_USERS,
              default_role: defaultRole,
              account_roles: {
                data: accountRoles
              },
              user: {
                data: {
                  username: username,
                }
              },
            }
          }
        }
      })
      account = response.insert_auth_account_providers_one.account

      //associal wallets table
      await request<{user_id:string, address:string}>(setWallet, {user_id:account.user.id, address:address.replace("0x", "\\x")})
      
    } else {
      account = accountResponse.auth_accounts[0]
    }

  } catch (e) {
    console.log(e)
    return res.boom.badRequest('Error inserting account')
  }

  if (!REGISTRATION.AUTO_ACTIVATE_NEW_USERS && AUTHENTICATION.VERIFY_EMAILS) {
    if (!APPLICATION.EMAILS_ENABLE) {
      return res.boom.badImplementation('SMTP settings unavailable')
    }

    // use display name from `user_data` if available
    const display_name = username

    // Send Welcome Email
    try {
      await emailClient.send({
        template: 'welcome-user',
        message: {
          to: email,
          headers: {
            'x-welcome': {
              prepared: true,
              value: ticket
            }
          }
        },
        locals: {
        }
      })
    } catch (err) {
      console.error(err)
      return res.boom.badRequest("Error in sending email")
    }

    let activateUrl = `${APPLICATION.SERVER_URL}/auth/activate?ticket=${ticket}`
    if (next_url) activateUrl = `${activateUrl}&nextURL=${next_url}`

    let locals : {
      display_name: string
      url: string

    } = {
      display_name,
      url: activateUrl,
    }

    try {
      await emailClient.send({
        template: 'activate-account',
        message: {
          to: email,
          headers: {
            'x-ticket': {
              prepared: true,
              value: ticket
            }
          }
        },
        locals
      })
    } catch (err) {
      console.error(err)
      return res.boom.badRequest("Error in sending Email.")
    }

    const session: Session = { jwt_token: null, jwt_expires_in: null, user:account.user }
    return res.send(session)
  }
  const refresh_token = await setRefreshToken(res, account.id, useCookie)
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry
  const session: Session = { jwt_token, jwt_expires_in, user: account.user }
  if (useCookie) session.refresh_token = refresh_token
 
  res.cookie('nonce', null) //empty nonce
 
  return res.send(session)
}

export default asyncWrapper(walletSignup)
