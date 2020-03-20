import { REDIRECT_URL_ERROR, REDIRECT_URL_SUCCESS } from '@shared/config'
import { Request, Response } from 'express'
import { activateUser, changeEmailByTicket, getNewEmailByTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/schema'

interface HasuraData {
  update_users: { affected_rows: number }
}

async function resetEmail({ query }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { ticket } = await verifySchema.validateAsync(query)

  const new_ticket = uuidv4()

  try {
    hasuraData = (await request(activateUser, {
      ticket,
      new_ticket,
      now: new Date()
    })) as HasuraData

    /**
     * Get `new_email` from database.
     */
    const new_email = await request(getNewEmailByTicket, { ticket })

    /**
     * Change email and ticket.
     */
    await request(changeEmailByTicket, { ticket: new_ticket, new_email })
  } catch (err) {
    if (REDIRECT_URL_ERROR) {
      return res.redirect(302, REDIRECT_URL_ERROR as string)
    }

    throw Boom.badImplementation()
  }

  const { affected_rows } = hasuraData.update_users

  if (affected_rows === 0) {
    if (REDIRECT_URL_ERROR) {
      return res.redirect(302, REDIRECT_URL_ERROR as string)
    }

    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  if (REDIRECT_URL_SUCCESS) {
    return res.redirect(302, REDIRECT_URL_SUCCESS as string)
  }

  res.status(204).send()
}

export default asyncWrapper(resetEmail)
