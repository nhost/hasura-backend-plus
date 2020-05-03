import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { asyncWrapper, selectAccount } from '@shared/helpers'
import { newJwtExpiry, setRefreshToken, createHasuraJwt } from '@shared/jwt'
import { loginAnonymouslySchema, loginSchema } from '@shared/validation'
import { insertAccount } from '@shared/queries'
import { request } from '@shared/request'
import { InsertAccountData } from '@shared/types'
import { AUTH_ANONYMOUS_USERS_ACTIVE, DEFAULT_ANONYMOUS_ROLE } from '@shared/config'

async function loginAccount({ body }: Request, res: Response): Promise<unknown> {
  if (AUTH_ANONYMOUS_USERS_ACTIVE) {
    const { anonymous } = loginAnonymouslySchema.validate(body).value

    // if user tries to sign in anonymously
    if (anonymous) {
      let hasura_data: InsertAccountData
      try {
        const ticket = uuidv4()
        hasura_data = await request(insertAccount, {
          account: {
            email: null,
            password_hash: null,
            ticket,
            active: true,
            is_anonymous: true,
            default_role: DEFAULT_ANONYMOUS_ROLE,
            account_roles: {
              data: [{ role: DEFAULT_ANONYMOUS_ROLE }]
            },
            user: {
              data: { display_name: 'Anonymous user' }
            }
          }
        })
      } catch (error) {
        throw Boom.badImplementation('Unable to create user and sign in user anonymously')
      }

      if (!hasura_data.insert_auth_accounts.returning.length) {
        throw Boom.badImplementation('Unable to create user and sign in user anonymously')
      }

      const account = hasura_data.insert_auth_accounts.returning[0]

      await setRefreshToken(res, account.id)

      return res.send({
        jwt_token: createHasuraJwt(account),
        jwt_expires_in: newJwtExpiry
      })
    }
  }

  // else, login users normally
  const { password } = await loginSchema.validateAsync(body)

  const account = await selectAccount(body)

  if (!account) {
    throw Boom.badRequest('Account does not exist.')
  }

  const { id, mfa_enabled, password_hash, active, ticket } = account

  if (!active) {
    throw Boom.badRequest('Account is not activated.')
  }

  if (!(await bcrypt.compare(password, password_hash))) {
    throw Boom.unauthorized('Password does not match.')
  }

  if (mfa_enabled) {
    return res.send({ mfa: true, ticket })
  }

  await setRefreshToken(res, id)

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(loginAccount)
