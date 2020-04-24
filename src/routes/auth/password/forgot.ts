import { HasuraAccountData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { SMTP_ENABLE } from '@shared/config'
import { emailClient } from '@shared/email'
import { forgotSchema } from '@shared/schema'
import { request } from '@shared/request'
import { selectAccountByEmail } from '@shared/queries'

/**
 * * Creates a new temporary ticket in the account, and optionnaly send the link by email
 */
async function forgotPassword({ body }: Request, res: Response): Promise<unknown> {
  const { email } = await forgotSchema.validateAsync(body)

  const hasuraData = (await request(selectAccountByEmail, { email })) as HasuraAccountData

  const account = hasuraData.auth_accounts[0]

  if (!account) {
    throw Boom.badRequest('Account does not exist.')
  }

  const { ticket } = account

  if (SMTP_ENABLE) {
    try {
      await emailClient.send({
        locals: { ticket },
        template: 'forgot',
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

  return res.status(204).send()
}

export default asyncWrapper(forgotPassword)
