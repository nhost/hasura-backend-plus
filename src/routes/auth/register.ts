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
  const password_hash = await hashPassword(password)

  await request(insertAccount, {
    account: {
      email,
      password_hash,
      ticket,
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
            'x-activate-link': {
              prepared: true,
              value: `${SERVER_URL}/auth/account/activate?ticket=${ticket}`
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
