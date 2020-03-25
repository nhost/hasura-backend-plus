import { Request, Response } from 'express'
import { changeEmailByTicket, getNewEmailByTicket, rotateTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/schema'

interface HasuraData {
  update_auth_accounts: { affected_rows: number }
}

interface HasuraAccount {
  auth_accounts: [{ new_email: string }]
}

async function resetEmail({ body }: Request, res: Response): Promise<unknown> {
  let hasuraData: HasuraData

  const { ticket } = await verifySchema.validateAsync(body)

  try {
    const {
      auth_accounts: [{ new_email }]
    } = (await request(getNewEmailByTicket, { ticket })) as HasuraAccount

    hasuraData = (await request(changeEmailByTicket, {
      ticket,
      new_email,
      now: new Date()
    })) as HasuraData

    await request(rotateTicket, {
      ticket,
      now: new Date(),
      new_ticket: uuidv4()
    })
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (!hasuraData.update_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  return res.status(204).send()
}

export default asyncWrapper(resetEmail)
