import { HasuraUserData, asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { SMTP_ENABLED } from '@shared/config'
import { emailClient } from '@shared/email'
import { forgotSchema } from '@shared/schema'
import { request } from '@shared/request'
import { selectUserByEmail } from '@shared/queries'

/**
 * * Creates a new temporary ticket in the user account, and optionnaly send the link by email
 */
async function forgotPassword({ body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraUserData

  const { email } = await forgotSchema.validateAsync(body)

  try {
    hasuraData = (await request(selectUserByEmail, { email })) as HasuraUserData
  } catch (err) {
    throw Boom.badImplementation()
  }

  const hasuraUser = hasuraData.private_user_accounts[0]

  if (!hasuraUser) {
    throw Boom.badRequest('User does not exist.')
  }

  const ticket = hasuraUser.user.ticket

  if (SMTP_ENABLED) {
    try {
      await emailClient.send({
        locals: { ticket },
        template: 'forgot',
        message: { to: email }
      })
    } catch (err) {
      throw Boom.badImplementation()
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(forgotPassword)
