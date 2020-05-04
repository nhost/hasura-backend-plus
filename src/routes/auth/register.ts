import { AUTO_ACTIVATE_NEW_USERS, SERVER_URL, SMTP_ENABLE } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectAccount } from '@shared/helpers'

import Boom from '@hapi/boom'
import { emailClient } from '@shared/email'
import { insertAccount } from '@shared/queries'
import { registerSchema } from '@shared/validation'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

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

  await request(insertAccount, {
    account: {
      email,
      password_hash,
      ticket,
      ticket_expires_at,
      active: AUTO_ACTIVATE_NEW_USERS,
      user: {
        data: { display_name: email, ...user_data }
      }
    }
  })

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
