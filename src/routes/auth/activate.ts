import { APPLICATION, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'

import { activateAccount } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/validation'
import { UpdateAccountData } from '@shared/types'

async function activateUser({ query }: Request, res: Response): Promise<unknown> {
  if (REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    return res.boom.badImplementation(`Please set the AUTO_ACTIVATE_NEW_USERS env variable to false to use the auth/activate route.`)
  }

  let hasuraData: UpdateAccountData

  const { ticket } = await verifySchema.validateAsync(query)

  const new_ticket = uuidv4()

  try {
    hasuraData = await request<UpdateAccountData>(activateAccount, {
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

  const { affected_rows } = hasuraData.update_auth_accounts

  if (!affected_rows) {
    console.error('Invalid or expired ticket')

    if (APPLICATION.REDIRECT_URL_ERROR) {
      return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
    }
    /* istanbul ignore next */
    return res.boom.unauthorized('Invalid or expired ticket.')
  }

  if (APPLICATION.REDIRECT_URL_SUCCESS) {
    return res.redirect(302, APPLICATION.REDIRECT_URL_SUCCESS)
  }

  res.status(200).send('Your account has been activated. You can close this window and login')
}

export default asyncWrapper(activateUser)
