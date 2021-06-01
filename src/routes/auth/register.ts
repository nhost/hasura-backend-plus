import { AUTHENTICATION, APPLICATION, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, isWhitelistedEmail, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'

import { emailClient } from '@shared/email'
import { insertAccount } from '@shared/queries'
import { setRefreshToken } from '@shared/cookies'
import { registerSchema, registerSchemaMagicLink } from '@shared/validation'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { InsertAccountData, UserData, Session } from '@shared/types'

async function registerAccount(req: Request, res: Response): Promise<unknown> {
  const body = req.body

  const useCookie = typeof body.cookie !== 'undefined' ? body.cookie : true

  const {
    email,
    password,
    user_data = {},
    register_options = {}
  } = await (AUTHENTICATION.MAGIC_LINK_ENABLE ? registerSchemaMagicLink : registerSchema).validateAsync(body)

  if(REGISTRATION.WHITELIST && !await isWhitelistedEmail(email)) {
    return res.boom.unauthorized('Email not whitelisted')
  }

  if (await selectAccount(body)) {
    return res.boom.badRequest('Account already exists.')
  }

  let password_hash: string | null = null;

  const ticket = uuidv4()
  const ticket_expires_at = new Date(+new Date() + 60 * 60 * 1000).toISOString() // active for 60 minutes

  if (typeof password !== 'undefined') {
    try {
      await checkHibp(password)
    } catch (err) {
      return res.boom.badRequest(err.message)
    }

    try {
      password_hash = await hashPassword(password)
    } catch (err) {
      return res.boom.internal(err.message)
    }
  }

  const defaultRole = register_options.default_role ?? REGISTRATION.DEFAULT_USER_ROLE
  const allowedRoles = register_options.allowed_roles ?? REGISTRATION.DEFAULT_ALLOWED_USER_ROLES

  // check if default role is part of allowedRoles
  if (!allowedRoles.includes(defaultRole)) {
    return res.boom.badRequest('Default role must be part of allowed roles.')
  }

  // check if allowed roles is a subset of ALLOWED_ROLES
  if (!allowedRoles.every((role: string) => REGISTRATION.ALLOWED_USER_ROLES.includes(role))) {
    return res.boom.badRequest('allowed roles must be a subset of ALLOWED_ROLES')
  }

  const accountRoles = allowedRoles.map((role: string) => ({ role }))

  let accounts: InsertAccountData
  try {
    accounts = await request<InsertAccountData>(insertAccount, {
      account: {
        email,
        password_hash,
        ticket,
        ticket_expires_at,
        active: REGISTRATION.AUTO_ACTIVATE_NEW_USERS,
        default_role: defaultRole,
        account_roles: {
          data: accountRoles
        },
        user: {
          data: { display_name: email, ...user_data }
        }
      }
    })
  } catch (e) {
    console.error('Error inserting user account')
    console.error(e)
    return res.boom.badImplementation('Error inserting user account')
  }

  const account = accounts.insert_auth_accounts.returning[0]
  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    email: account.email,
    avatar_url: account.user.avatar_url
  }

  if (!REGISTRATION.AUTO_ACTIVATE_NEW_USERS && AUTHENTICATION.VERIFY_EMAILS) {
    if (!APPLICATION.EMAILS_ENABLE) {
      return res.boom.badImplementation('SMTP settings unavailable')
    }

    // use display name from `user_data` if available
    const display_name = 'display_name' in user_data ? user_data.display_name : email

    if (typeof password === 'undefined') {
      try {
        await emailClient.send({
          template: 'magic-link',
          message: {
            to: user.email,
            headers: {
              'x-token': {
                prepared: true,
                value: ticket
              }
            }
          },
          locals: {
            display_name,
            token: ticket,
            url: APPLICATION.SERVER_URL,
            action: 'sign up'
          }
        })
      } catch (err) {
        console.error(err)
        return res.boom.badImplementation()
      }

      const session: Session = { jwt_token: null, jwt_expires_in: null, user }
      return res.send(session)
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
        locals: {
          display_name,
          ticket,
          url: APPLICATION.SERVER_URL
        }
      })
    } catch (err) {
      console.error(err)
      return res.boom.badImplementation()
    }

    const session: Session = { jwt_token: null, jwt_expires_in: null, user }
    return res.send(session)
  }

  const refresh_token = await setRefreshToken(res, account.id, useCookie)

  // generate JWT
  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry

  const session: Session = { jwt_token, jwt_expires_in, user }
  if (!useCookie) session.refresh_token = refresh_token

  return res.send(session)
}

export default asyncWrapper(registerAccount)
