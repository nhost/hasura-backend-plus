import { asyncWrapper, selectAccountByEmail } from '@shared/helpers'
import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { SMTP_ENABLE, SERVER_URL } from '@shared/config'
import { emailClient } from '@shared/email'
import { forgotSchema } from '@shared/validation'
import {} from '@shared/queries'

/**
 * * Creates a new temporary ticket in the account, and optionnaly send the link by email
 */
async function requestChangePassword({ body }: Request, res: Response): Promise<unknown> {
  const { email } = await forgotSchema.validateAsync(body)

  const { ticket } = await selectAccountByEmail(email)

  if (SMTP_ENABLE) {
    try {
      await emailClient.send({
        template: 'change-password',
        locals: { ticket, url: SERVER_URL },
        message: {
          to: email,
          headers: {
            'x-ticket': {
              prepared: true,
              value: ticket as string
            }
          }
        }
      })
    } catch (err) {
      console.error(err)
      throw Boom.badImplementation()
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(requestChangePassword)
