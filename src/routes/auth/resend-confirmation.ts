import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { asyncWrapper, selectAccount, updateAccountTicket } from '@shared/helpers'
import { APPLICATION, REGISTRATION } from '@shared/config'
import { emailClient } from '@shared/email'
import { UserData } from '@shared/types'

/**
 * Sends the activate account email with a new ticket
 */
async function resendConfirmation(req: Request, res: Response): Promise<unknown> {
  if (REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    return res.boom.badImplementation(`Accounts are automatically activated.`)
  }

  const body = req.body
  const next_url = req.body.next_url as string
  delete req.body.next_url

  try {
    const account = await selectAccount(body)

    if (!account) {
      return res.boom.badRequest('Account does not exist.')
    } else if (account.active) {
      return res.boom.badRequest('Account already activated.')
    }

    const ticket = uuidv4()
    const now = new Date()
    const ticket_expires_at = new Date()
    ticket_expires_at.setTime(now.getTime() + 60 * 60 * 1000) // active for 60 minutes

    const user: UserData = {
      id: account.user.id,
      display_name: account.user.display_name,
      email: account.email,
      avatar_url: account.user.avatar_url
    }

    if (!APPLICATION.EMAILS_ENABLE) {
      return res.boom.badImplementation('SMTP settings unavailable')
    }

    // use display name from `user_data` if available
    const display_name = user.display_name || ""

    await updateAccountTicket(account.id, ticket, ticket_expires_at)

    let activateUrl = `${APPLICATION.SERVER_URL}/auth/activate?ticket=${ticket}`
    if (next_url) activateUrl = `${activateUrl}&nextURL=${next_url}`
    let locals : {
      display_name: string | undefined
      url: string

    } = {
      display_name,
      url: activateUrl,
    }

    await emailClient.send({
      template: 'activate-account',
      message: {
        to: user.email,
        headers: {
          'x-ticket': {
            prepared: true,
            value: ticket
          }
        }
      },
      locals
    })

    return res.status(204).send()
  } catch (err) {
    console.error(err)
    return res.boom.badRequest("Failed to resend confirmation.")
  }
}

export default asyncWrapper(resendConfirmation)
