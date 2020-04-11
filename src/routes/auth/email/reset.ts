import { Request, Response } from 'express'
import { changeEmailByTicket, getNewEmailByTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { asyncWrapper, rotateTicket } from '@shared/helpers'
import { request } from '@shared/request'
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
  } catch (err) {
    throw Boom.badImplementation()
  }

  if (!hasuraData.update_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  await rotateTicket(ticket)

  return res.status(204).send()
}

export default asyncWrapper(resetEmail)
