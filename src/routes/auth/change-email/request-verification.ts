import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { setNewTicket, setNewEmail } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { APPLICATION, AUTHENTICATION } from '@shared/config'
import { emailClient } from '@shared/email'
import { request } from '@shared/request'
import { SetNewEmailData } from '@shared/types'
import { selectAccountByEmail } from '@shared/helpers'
import { emailResetSchema } from '@shared/validation'

import { RequestExtended } from '@shared/types'

async function requestChangeEmail(req: RequestExtended, res: Response): Promise<any> {
  console.log('AUTHENTICATION.VERIFY_EMAILS: ', AUTHENTICATION.VERIFY_EMAILS);
  if(!AUTHENTICATION.VERIFY_EMAILS) {
    // return res.boom.badImplementation(`Please set the VERIFY_EMAILS env variable to true to use the auth/change-email/request route.`)
  }
  // smtp must be enabled for request change password to work.
  if (!APPLICATION.EMAILS_ENABLE) {
    return res.boom.badImplementation('SMTP settings unavailable')
  }

  if (!req.permission_variables) {
    throw res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables
  const { new_email } = await emailResetSchema.validateAsync(req.body)

  // make sure new_email is not attached to an account yet
  let account_exists = true
  try {
    await selectAccountByEmail(new_email)
    // Account using new_email already exists - pass
  } catch {
    // No existing account is using the new email address. Good!
    account_exists = false
  }

  res.setHeader('Content-Type', 'application/json');

  if (account_exists) {
    return res.end(JSON.stringify({"success": false, "message": "Email already exists."}))
  }

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
    return res.boom.badImplementation('Unable to set new ticket')
  }
  // set new email
  let display_name
  try {
    const setNewEmailReturn = await request<SetNewEmailData>(setNewEmail, { user_id, new_email })
    display_name = setNewEmailReturn.update_auth_accounts.returning[0].user.display_name
  } catch (error) {
    console.error(error)
    return res.boom.badImplementation('unable to set new email')
  }
  // send email
  try {
    await emailClient.send({
      template: 'change-email',
      locals: {
        ticket,
        url: APPLICATION.SERVER_URL,
        display_name
      },
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
    return res.boom.badImplementation()
  }

  return res.end(JSON.stringify({"success": true, "message": "Email change requested successfully."}))
}

export default asyncWrapper(requestChangeEmail)
