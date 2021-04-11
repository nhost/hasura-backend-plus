import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket, selectAccountByTicket } from '@shared/helpers'
import { changeEmailByTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { request } from '@shared/request'
import { verifySchema } from '@shared/validation'
import { UpdateAccountData } from '@shared/types'
import { v4 as uuidv4 } from 'uuid'
import { APPLICATION, AUTHENTICATION } from '@shared/config'
import { emailClient } from '@shared/email'

async function changeEmail({ body }: Request, res: Response): Promise<unknown> {
  if(!AUTHENTICATION.VERIFY_EMAILS) {
    throw Boom.badImplementation(`Please set the VERIFY_EMAILS env variable to true to use the auth/change-email/change route.`)
  }

  const { ticket } = await verifySchema.validateAsync(body)

  const { email, new_email, user } = await selectAccountByTicket(ticket)

  const hasuraData = await request<UpdateAccountData>(changeEmailByTicket, {
    ticket,
    new_email,
    now: new Date(),
    new_ticket: uuidv4()
  })

  if (!hasuraData.update_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  if (AUTHENTICATION.NOTIFY_EMAIL_CHANGE && APPLICATION.EMAILS_ENABLE) {
    try {
      await emailClient.send({
        template: 'notify-email-change',
        locals: {
          url: APPLICATION.SERVER_URL,
          display_name: user.display_name
        },
        message: {
          to: email
        }
      })
    } catch (err) {
      console.error('Unable to send email')
      console.error(err)
      throw Boom.badImplementation()
    }
  }
  await rotateTicket(ticket)

  return res.status(204).send()
}

export default asyncWrapper(changeEmail)
