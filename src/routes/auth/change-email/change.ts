import { Request, Response } from 'express'
import { asyncWrapper, rotateTicket } from '@shared/helpers'
import { changeEmailByTicket, getNewEmailByTicket } from '@shared/queries'

import Boom from '@hapi/boom'
import { request } from '@shared/request'
import { verifySchema } from '@shared/validation'
import { QueryAccountData, UpdateAccountData } from '@shared/types'

async function changeEmail({ body }: Request, res: Response): Promise<unknown> {
  const { ticket } = await verifySchema.validateAsync(body)

  const {
    auth_accounts: [{ new_email }]
  } = await request<QueryAccountData>(getNewEmailByTicket, { ticket })

  const hasuraData = await request<UpdateAccountData>(changeEmailByTicket, {
    ticket,
    new_email,
    now: new Date()
  })

  if (!hasuraData.update_auth_accounts.affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  await rotateTicket(ticket)

  return res.status(204).send()
}

export default asyncWrapper(changeEmail)
