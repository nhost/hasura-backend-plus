import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket } from '@shared/helpers'
import { changeEmailByTicket, getNewEmailByTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { request } from '@shared/request'
import { verifySchema } from '@shared/schema'

interface HasuraData {
  update_auth_accounts: { affected_rows: number }
}

interface HasuraAccount {
  auth_accounts: [{ new_email: string }]
}

async function resetEmail({ body }: Request, res: Response): Promise<unknown> {
  const { ticket } = await verifySchema.validateAsync(body)

  const {
    auth_accounts: [{ new_email }]
  } = (await request(getNewEmailByTicket, { ticket })) as HasuraAccount

  const hasuraData = (await request(changeEmailByTicket, {
    ticket,
    new_email,
    now: new Date()
  })) as HasuraData

  if (!hasuraData.update_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  await rotateTicket(ticket)

  return res.status(204).send()
}

export default asyncWrapper(resetEmail)
