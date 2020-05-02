import { asyncWrapper, selectAccountByEmail } from '@shared/helpers'
import { Request, Response } from 'express'

import { SMTP_ENABLE, SERVER_URL } from '@shared/config'
import { emailClient } from '@shared/email'
import { forgotSchema } from '@shared/validation'
import { setNewTicket } from '@shared/queries'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import Boom from '@hapi/boom'

/**
 * * Creates a new temporary ticket in the account, and optionnaly send the link by email
 * Always return status code 204 in order to not leak information about emails in our database
 */
async function requestChangePassword({ body }: Request, res: Response): Promise<unknown> {
  // smtp must be enabled for request change password to work.
  if (!SMTP_ENABLE) {
    throw Boom.badImplementation(
      'The change password request function is not activated. No SMTP settings available'
    )
  }

  const { email } = await forgotSchema.validateAsync(body)

  const account = await selectAccountByEmail(email)

  if (!account) {
    console.error('Account does not exist')
    return res.status(204).send()
  }

  // generate new ticket and ticket_expires_at
  const ticket = uuidv4()
  const now = new Date()
  const ticket_expires_at = new Date()

  // ticket active for 30 minutes
  ticket_expires_at.setTime(now.getTime() + 30 * 60 * 1000)

  // set new ticket
  try {
    await request(setNewTicket, {
      user_id: account.user.id,
      ticket,
      ticket_expires_at
    })
  } catch (error) {
    console.error('Unable to set new ticket for user')
    return res.status(204).send()
  }

  // send email
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
    console.error('Unable to send email')
    console.error(err)
    return res.status(204).send()
  }

  return res.status(204).send()
}

export default asyncWrapper(requestChangePassword)
