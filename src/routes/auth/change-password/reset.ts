import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import Boom from '@hapi/boom'

import { asyncWrapper, checkHibp, hashPassword } from '@shared/helpers'
import { resetPasswordWithTicketSchema } from '@shared/validation'
import { updatePasswordWithTicket } from '@shared/queries'
import { request } from '@shared/request'
import { UpdateAccountData, RequestExtended } from '@shared/types'

/**
 * Reset the password, either from a valid ticket or from a valid JWT and a valid password
 */
async function resetPassword(req: RequestExtended, res: Response): Promise<unknown> {
  // Reset the password from { ticket, new_password }
  const { ticket, new_password } = await resetPasswordWithTicketSchema.validateAsync(req.body)

  await checkHibp(new_password)
  const password_hash = await hashPassword(new_password)

  const hasuraData = await request<UpdateAccountData>(updatePasswordWithTicket, {
    ticket,
    password_hash,
    now: new Date(),
    new_ticket: uuidv4()
  })

  const { affected_rows } = hasuraData.update_auth_accounts
  if (!affected_rows) {
    throw Boom.unauthorized('Invalid or expired ticket.')
  }

  return res.status(204).send()
}

export default asyncWrapper(resetPassword)
