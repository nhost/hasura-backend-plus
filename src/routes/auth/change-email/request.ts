import { asyncWrapper, selectAccountByEmail } from '@shared/helpers'
import { Request, Response } from 'express'
import { setNewTicket, setNewEmail } from '@shared/queries'

import Boom from '@hapi/boom'
import { SMTP_ENABLE, SERVER_URL } from '@shared/config'
import { emailClient } from '@shared/email'
import { emailResetSchema } from '@shared/validation'
import { request } from '@shared/request'
import { getClaims } from '@shared/jwt'
import { v4 as uuidv4 } from 'uuid'

async function requestChangeEmail({ body, headers }: Request, res: Response): Promise<unknown> {
  // smtp must be enabled for request change password to work.
  if (!SMTP_ENABLE) {
    throw Boom.badImplementation('SMTP settings unavailable')
  }

  // get current user_id
  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

  // validate new email
  const { new_email } = await emailResetSchema.validateAsync(body)

  // generate new ticket and ticket_expires_at
  const ticket = uuidv4()
  const now = new Date()
  const ticket_expires_at = new Date()

  // ticket active for 60 minutes
  ticket_expires_at.setTime(now.getTime() + 60 * 60 * 1000)

  // set new ticket
  try {
    await request(setNewTicket, {
      user_id,
      ticket,
      ticket_expires_at
    })
  } catch (error) {
    console.error('Unable to set new ticket for user')
    return Boom.badImplementation('Unable to set new ticket')
  }

  // make sure new_email is not attached to an account yet
  let account_exists = true
  try {
    await selectAccountByEmail(new_email)
    // Account using new_email already exists - pass
  } catch {
    // No existing account is using the new email address. Good!
    account_exists = false
  }

  if (account_exists) {
    throw Boom.badRequest('Cannot use this email.')
  }

  // set new email
  try {
    await request(setNewEmail, { user_id, new_email })
  } catch (error) {
    console.error(error)
    throw Boom.badImplementation('unable to set new email')
  }

  // send email
  try {
    await emailClient.send({
      template: 'change-email',
      locals: { ticket, url: SERVER_URL },
      message: {
        to: new_email,
        headers: {
          'x-ticket': {
            prepared: true,
            value: ticket
          }
        }
      }
    })
  } catch (err) {
    console.error('Unable to send email')
    console.error(err)
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default asyncWrapper(requestChangeEmail)
