import { APPLICATION, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'

import { activateAccount, setNewTicket } from '@shared/queries'
import { asyncWrapper, deanonymizeAccount, selectAccountByTicket } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/validation'
import { AccountData, UpdateAccountData } from '@shared/types'

async function activateUser({ query }: Request, res: Response): Promise<unknown> {
  if (REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    return res.boom.badImplementation(`Please set the AUTO_ACTIVATE_NEW_USERS env variable to false to use the auth/activate route.`)
  }

  const { ticket } = await verifySchema.validateAsync(query)

  let account: AccountData
  try {
    account = await selectAccountByTicket(ticket)

    if (APPLICATION.REDIRECT_URL_ERROR) {
      return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
    }
  } catch {
    return res.boom.unauthorized('Invalid or expired ticket.')
  }

  const new_ticket = uuidv4()

  if(account.is_anonymous) {
    await deanonymizeAccount(
      account.id,
    )

    await request(setNewTicket, {
      user_id: account.user.id,
      ticket: new_ticket,
      ticket_expires_at: new Date()
    })
  } else {
    try {
      await request<UpdateAccountData>(activateAccount, {
        ticket,
        new_ticket,
        now: new Date()
      })
    } catch (err) /* istanbul ignore next */ {
      console.error(err)
      if (APPLICATION.REDIRECT_URL_ERROR) {
        return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
      }
      throw err
    }
  }

  if(APPLICATION.REDIRECT_URL_SUCCESS) {
    res.redirect(APPLICATION.REDIRECT_URL_SUCCESS.replace('JWT_TOKEN', ticket))
  } else
    res.status(200).send('Your account has been activated. You can close this window and login')
}

export default asyncWrapper(activateUser)
