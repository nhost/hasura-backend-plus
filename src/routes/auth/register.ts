import { AUTO_ACTIVATE, SERVER_URL, SMTP_ENABLED } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectUser } from '@shared/helpers'

import Boom from '@hapi/boom'
import { emailClient } from '@shared/email'
import { insertUser } from '@shared/queries'
import { registerSchema } from '@shared/schema'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'

async function registerUser({ body }: Request, res: Response): Promise<unknown> {
  const { email, password } = await registerSchema.validateAsync(body)
  const user = await selectUser(body)

  if (user) {
    throw Boom.badRequest('user already exists')
  }

  await checkHibp(password)

  try {
    const ticket = uuidv4()
    const password_hash = await hashPassword(password)
    await request(insertUser, {
      user: {
        display_name: email,
        accounts: {
          data: {
            email,
            password_hash,
            ticket,
            active: AUTO_ACTIVATE
          }
        }
      }
    })

    if (!AUTO_ACTIVATE && SMTP_ENABLED) {
      await emailClient.send({
        template: 'confirm',
        message: {
          to: email,
          headers: {
            'x-activate-link': {
              prepared: true,
              value: `${SERVER_URL}/auth/user/activate?ticket=${ticket}`
            }
          }
        },
        locals: {
          ticket,
          display_name: '',
          url: SERVER_URL
        }
      })
    }
  } catch (err) {
    console.log(err)
    throw Boom.badImplementation()
  }
  return res.status(204).send()
}

export default asyncWrapper(registerUser)
