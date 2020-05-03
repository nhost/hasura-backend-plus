import {
  AUTO_ACTIVATE_NEW_USERS,
  SERVER_URL,
  SMTP_ENABLE,
  DEFAULT_ANONYMOUS_ROLE,
  DEFAULT_USER_ROLE
} from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectAccount } from '@shared/helpers'

import Boom from '@hapi/boom'
import { emailClient } from '@shared/email'
import { insertAccount, registerAnonymousUser } from '@shared/queries'
import { registerSchema } from '@shared/validation'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { getClaims } from '@shared/jwt'

async function registerAccount({ body, headers }: Request, res: Response): Promise<unknown> {
  const { email, password, user_data = {} } = await registerSchema.validateAsync(body)
  const account = await selectAccount(body)

  if (account) {
    throw Boom.badRequest('Account already exists.')
  }

  await checkHibp(password)

  const ticket = uuidv4()
  const password_hash = await hashPassword(password)

  let anonymousUserId
  try {
    const claims = getClaims(headers.authorization)
    if (claims['x-hasura-default-role'] === DEFAULT_ANONYMOUS_ROLE) {
      anonymousUserId = claims['x-hasura-user-id']
    }
  } catch (err) {
    anonymousUserId = undefined
  }

  if (account) {
    // * Existing anonymous account: update the existing one
    await request(registerAnonymousUser, {
      user_id: anonymousUserId,
      email,
      password_hash,
      user_role: DEFAULT_USER_ROLE,
      anonymous_role: DEFAULT_ANONYMOUS_ROLE,
      active: AUTO_ACTIVATE_NEW_USERS,
      user_data: { display_name: email, ...user_data }
    })
  } else {
    // * New account: insert a new one
    await request(insertAccount, {
      account: {
        email,
        password_hash,
        ticket,
        active: AUTO_ACTIVATE_NEW_USERS,
        default_role: DEFAULT_USER_ROLE,
        account_roles: {
          data: [{ role: DEFAULT_USER_ROLE }]
        },
        user: {
          data: { display_name: email, ...user_data }
        }
      }
    })
  }

  if (!AUTO_ACTIVATE_NEW_USERS && SMTP_ENABLE) {
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
          display_name: '',
          ticket,
          url: SERVER_URL
        }
      })
    } catch (err) {
      console.error(err)
      throw Boom.badImplementation()
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(registerAccount)
