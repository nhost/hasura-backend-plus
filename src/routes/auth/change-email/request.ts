import { asyncWrapper, selectAccountByEmail } from '@shared/helpers'
import { Request, Response } from 'express'
import { saveNewEmail } from '@shared/queries'

import Boom from '@hapi/boom'
import { SMTP_ENABLE, SERVER_URL } from '@shared/config'
import { emailClient } from '@shared/email'
import { emailResetSchema } from '@shared/validation'
import { request } from '@shared/request'

async function requestChangeEmail({ body }: Request, res: Response): Promise<unknown> {
  const { email, new_email } = await emailResetSchema.validateAsync(body)
  const { ticket } = await selectAccountByEmail(email)

  try {
    await selectAccountByEmail(new_email)
    // Account using new_email already exists - pass
  } catch {
    // No existing account is using the new email address. Good!
    if (SMTP_ENABLE) {
      try {
        await emailClient.send({
          template: 'change-email',
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
        throw Boom.badImplementation()
      }
    }
    /**
     * Save the `new_email` in the database.
     * https://github.com/nhost/hasura-backend-plus/pull/121#discussion_r395464612
     */
    await request(saveNewEmail, { email, new_email })
    return res.status(204).send()
  }
  throw Boom.badRequest('Cannot use this email.')
}

export default asyncWrapper(requestChangeEmail)
