import {
  AUTO_ACTIVATE_NEW_USERS,
  SERVER_URL,
  EMAILS_ENABLE,
  DEFAULT_USER_ROLE,
  DEFAULT_ALLOWED_USER_ROLES,
  ALLOWED_USER_ROLES,
  VERIFY_EMAILS
} from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectAccount } from '@shared/helpers'

import Boom from '@hapi/boom'
import { emailClient } from '@shared/email'
import { insertAccount } from '@shared/queries'
import { registerSchema } from '@shared/validation'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { InsertAccountData } from '@shared/types'

async function registerAccount({ body }: Request, res: Response): Promise<unknown> {
  const {
    email,
    password,
    user_data = {},
    register_options = {}
  } = await registerSchema.validateAsync(body)
  const account = await selectAccount(body)

  if (account) {
    throw Boom.badRequest('Account already exists.')
  }

  await checkHibp(password)

  const ticket = uuidv4()
  const now = new Date()
  const ticket_expires_at = new Date()
  ticket_expires_at.setTime(now.getTime() + 60 * 60 * 1000) // active for 60 minutes
  const password_hash = await hashPassword(password)

  const defaultRole = register_options.default_role ?? DEFAULT_USER_ROLE
  const allowedRoles = register_options.allowed_roles ?? DEFAULT_ALLOWED_USER_ROLES

  // check if default role is part of allowedRoles
  if (!allowedRoles.includes(defaultRole)) {
    throw Boom.badRequest('Default role must be part of allowed roles.')
  }

  // check if defaultRole appears is part of allowed roles
  if (!allowedRoles.includes(defaultRole)) {
    throw Boom.badRequest('Default role must be in allowed roles')
  }

  // check if allowed roles is a subset of ALLOWED_ROLES
  if (!allowedRoles.every((role: string) => ALLOWED_USER_ROLES.includes(role))) {
    throw Boom.badRequest('allowed roles must be a subset of ALLOWED_ROLES')
  }

  const accountRoles = allowedRoles.map((role: string) => ({ role }))

  try {
    await request<InsertAccountData>(insertAccount, {
      account: {
        email,
        password_hash,
        ticket,
        ticket_expires_at,
        active: AUTO_ACTIVATE_NEW_USERS,
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
    throw Boom.badImplementation('Error inserting user account')
  }

  if (!AUTO_ACTIVATE_NEW_USERS && VERIFY_EMAILS) {
    if (!EMAILS_ENABLE) {
      throw Boom.badImplementation('SMTP settings unavailable')
    }

    // use display name from `user_data` if available
    const display_name = 'display_name' in user_data ? user_data.display_name : email

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
