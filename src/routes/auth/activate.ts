import { REDIRECT_URL_ERROR, REDIRECT_URL_SUCCESS } from '@shared/config'
import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { activateAccount } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/validation'
import { UpdateAccountData } from '@shared/types'

async function activateUser({ query }: Request, res: Response): Promise<unknown> {
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
    if (REDIRECT_URL_ERROR) {
      return res.redirect(302, REDIRECT_URL_ERROR as string)
    }
    throw err
  }

  const { affected_rows } = hasuraData.update_auth_accounts

  if (!affected_rows) {
    console.error('Invalid or expired ticket')

    if (REDIRECT_URL_ERROR) {
      return res.redirect(302, REDIRECT_URL_ERROR as string)
    }
    /* istanbul ignore next */
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  if (REDIRECT_URL_SUCCESS) {
    return res.redirect(302, REDIRECT_URL_SUCCESS as string)
  }

  res.status(200).send('Your account has been activated. You can close this window and login')
}

export default asyncWrapper(activateUser)
