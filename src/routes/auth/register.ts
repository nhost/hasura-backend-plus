import {
  AUTO_ACTIVATE_NEW_USERS,
  SERVER_URL,
  EMAILS_ENABLE,
  DEFAULT_USER_ROLE,
  DEFAULT_ALLOWED_USER_ROLES,
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
  const { email, password, user_data = {} } = await registerSchema.validateAsync(body)
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

  try {
    await request<InsertAccountData>(insertAccount, {
      account: {
        email,
        password_hash,
        ticket,
        ticket_expires_at,
        active: AUTO_ACTIVATE_NEW_USERS,
        default_role: DEFAULT_USER_ROLE,
        account_roles: {
          data: DEFAULT_ALLOWED_USER_ROLES.map((role) => ({ role }))
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
