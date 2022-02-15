import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { asyncWrapper, selectAccountByEmail } from '@shared/helpers'
import { APPLICATION, AUTHENTICATION } from '@shared/config'
import { emailClient } from '@shared/email'
import { forgotSchema } from '@shared/validation'
import { setNewTicket } from '@shared/queries'
import { request } from '@shared/request'
import { AccountData } from '@shared/types'

/**
 * * Creates a new temporary ticket in the account, and optionnaly send the link by email
 * Always return status code 204 in order to not leak information about emails in the database
 */
async function requestChangePassword({ body }: Request, res: Response): Promise<unknown> {
  console.log('inside /change-password/request')

  if (!AUTHENTICATION.LOST_PASSWORD_ENABLED) {
    return res.boom.badImplementation(
      `Please set the LOST_PASSWORD_ENABLED env variable to true to use the auth/change-password/request route.`
    )
  }

  // smtp must be enabled for request change password to work.
  if (!APPLICATION.EMAILS_ENABLE) {
    console.log('emails not enabled')
    return res.boom.badImplementation('SMTP settings unavailable')
  }

  const { email, token } = await forgotSchema.validateAsync(body)

  if (!token) return res.boom.badRequest('Invalid Request!')

  let passCaptcha = false

  try {
    const data = new URLSearchParams()
    data.append('secret', APPLICATION.HCAPTCHA_SECRET)
    data.append('response', process.env.NODE_ENV === 'development' ? APPLICATION.HCAPTCHA_LOCAL_RESPONSE : token)
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'post',
      body: data
    }).then(res => res.json())
    console.log('hCaptCha response', response)
    passCaptcha = response.success
  } catch (err) {
    console.error(err.message)
    return res.boom.badRequest('Invalid Request!')
  }

  if (!passCaptcha) return res.boom.badRequest('Invalid Request!')

  let account: AccountData

  try {
    account = await selectAccountByEmail(email)
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  if (!account) {
    console.error('Account does not exist')
    return res.status(204).send()
  }

  if (!account.active) {
    console.error('Account is not active')
    return res.status(204).send()
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
      template: 'lost-password',
      locals: {
        ticket,
        url: APPLICATION.APP_URL,
        display_name: account.user.display_name
      },
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
