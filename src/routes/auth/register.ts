import { AUTO_ACTIVATE, SERVER_URL, SMTP_ENABLED } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectAccount } from '@shared/helpers'

import Boom from '@hapi/boom'
import { emailClient } from '@shared/email'
import { insertAccount } from '@shared/queries'
import { registerSchema } from '@shared/schema'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

async function registerAccount({ body }: Request, res: Response): Promise<unknown> {
  const { email, password } = await registerSchema.validateAsync(body)
  const account = await selectAccount(body)

  if (account) {
    throw Boom.badRequest('account already exists')
  }

  await checkHibp(password)

  const ticket = uuidv4()
  const password_hash = await hashPassword(password)

  try {
    await request(insertAccount, {
      account: {
        email,
        password_hash,
        ticket,
        user: {
          data: { display_name: email }
        }
      }
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (!AUTO_ACTIVATE && SMTP_ENABLED) {
    try {
      await emailClient.send({
        template: 'confirm',
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
