import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { asyncWrapper, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'
import { setRefreshToken } from '@shared/cookies'
import { loginAnonymouslySchema, loginSchema, magicLinkLoginSchema } from '@shared/validation'
import { insertAccount } from '@shared/queries'
import { request } from '@shared/request'
import { AccountData, UserData, Session } from '@shared/types'
import { emailClient } from '@shared/email'
import { AUTHENTICATION, APPLICATION, REGISTRATION, HEADERS } from '@shared/config'

interface HasuraData {
  insert_auth_accounts: {
    affected_rows: number
    returning: AccountData[]
  }
}

async function loginAccount({ body, headers }: Request, res: Response): Promise<unknown> {
  // default to true
  const useCookie = typeof body.cookie !== 'undefined' ? body.cookie : true

  if (AUTHENTICATION.ANONYMOUS_USERS_ENABLE) {
    const { anonymous } = await loginAnonymouslySchema.validateAsync(body)

    // if user tries to sign in anonymously
    if (anonymous) {
      let hasura_data: HasuraData
      try {
        const ticket = uuidv4()
        hasura_data = await request(insertAccount, {
          account: {
            email: null,
            password_hash: null,
            ticket,
            active: true,
            is_anonymous: true,
            default_role: REGISTRATION.DEFAULT_ANONYMOUS_ROLE,
            account_roles: {
              data: [{ role: REGISTRATION.DEFAULT_ANONYMOUS_ROLE }]
            },
            user: {
              data: { display_name: 'Anonymous user' }
            }
          }
        })
      } catch (error) {
        return res.boom.badImplementation('Unable to create user and sign in user anonymously')
      }

      if (!hasura_data.insert_auth_accounts.returning.length) {
        return res.boom.badImplementation('Unable to create user and sign in user anonymously')
      }

      const account = hasura_data.insert_auth_accounts.returning[0]

      const refresh_token = await setRefreshToken(res, account.id, useCookie)

      const jwt_token = createHasuraJwt(account)
      const jwt_expires_in = newJwtExpiry

      const session: Session = { jwt_token, jwt_expires_in, user: account.user }
      if (useCookie) session.refresh_token = refresh_token

      return res.send(session)
    }
  }

  // else, login users normally
  const { password } = await (AUTHENTICATION.ENABLE_MAGIC_LINK ? magicLinkLoginSchema : loginSchema).validateAsync(body)

  const account = await selectAccount(body)

  if (!account) {
    return res.boom.badRequest('Account does not exist.')
  }

  const { id, mfa_enabled, password_hash, active, ticket, email } = account

  if (typeof password === 'undefined') {
    const refresh_token = await setRefreshToken(res, id, useCookie)

    try {
      await emailClient.send({
        template: 'magic-link',
        message: {
          to: email,
          headers: {
            'x-token': {
              prepared: true,
              value: refresh_token
            }
          }
        },
        locals: {
          display_name: account.user.display_name,
          token: refresh_token,
          url: APPLICATION.SERVER_URL,
          action: 'log in'
        }
      })

      return res.send({ magicLink: true });
    } catch (err) {
      console.error(err)
      return res.boom.badImplementation()
    }
  }

  if (!active) {
    return res.boom.badRequest('Account is not activated.')
  }

  // Handle User Impersonation Check
  const adminSecret = headers[HEADERS.ADMIN_SECRET_HEADER]
  const hasAdminSecret = Boolean(adminSecret)
  const isAdminSecretCorrect = adminSecret === APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET
  let userImpersonationValid = false;
  if (AUTHENTICATION.USER_IMPERSONATION_ENABLE && hasAdminSecret && !isAdminSecretCorrect) {
    return res.boom.unauthorized('Invalid x-admin-secret')
  } else if (AUTHENTICATION.USER_IMPERSONATION_ENABLE && hasAdminSecret && isAdminSecretCorrect) {
    userImpersonationValid = true;
  }

  // Validate Password
  const isPasswordCorrect = await bcrypt.compare(password, password_hash)
  if (!isPasswordCorrect && !userImpersonationValid) {
    return res.boom.unauthorized('Username and password do not match')
  }

  if (mfa_enabled) {
    return res.send({ mfa: true, ticket })
  }

  // refresh_token
  const refresh_token = await setRefreshToken(res, id, useCookie)

  // generate JWT
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

  res.send(session)
}

export default asyncWrapper(loginAccount)
