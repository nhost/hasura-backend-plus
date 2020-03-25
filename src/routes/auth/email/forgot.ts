import { HasuraAccountData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'
import { saveNewEmail, selectAccountByEmail } from '@shared/queries'

import Boom from '@hapi/boom'
import { SMTP_ENABLED } from '@shared/config'
import { emailClient } from '@shared/email'
import { emailResetSchema } from '@shared/schema'
import { request } from '@shared/request'

async function resetEmail({ body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraAccountData

  const { email, new_email } = await emailResetSchema.validateAsync(body)

  try {
    hasuraData = (await request(selectAccountByEmail, { email })) as HasuraAccountData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const account = hasuraData.auth_accounts[0]

  if (!account) {
    throw Boom.badRequest('Account does not exist.')
  }

  const ticket = account.ticket

  if (SMTP_ENABLED) {
    try {
      await emailClient.send({
        template: 'email',
        locals: { ticket },
        message: { to: email }
      })

      /**
       * Save the `new_email` in the database.
       * https://github.com/nhost/hasura-backend-plus/pull/121#discussion_r395464612
       */
      await request(saveNewEmail, { email, new_email })
    } catch (err) {
      throw Boom.badImplementation()
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(resetEmail)
