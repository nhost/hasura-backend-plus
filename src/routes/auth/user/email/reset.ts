import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import { v4 as uuidv4 } from 'uuid'

import { activateUser, changeEmailByTicket, getNewEmailByTicket } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { verifySchema } from '@shared/schema'

interface HasuraData {
  update_users: { affected_rows: number }
}

async function resetEmail({ body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { ticket } = await verifySchema.validateAsync(body)

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
    throw Boom.badImplementation()
  }

  const { affected_rows } = hasuraData.update_users

  if (affected_rows === 0) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  return res.status(204).send()
}

export default asyncWrapper(resetEmail)
