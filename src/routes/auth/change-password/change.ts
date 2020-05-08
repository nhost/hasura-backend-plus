import {
  asyncWrapper,
  checkHibp,
  hashPassword,
  selectAccountByUserId,
  getPermissionVariablesFromCookie
} from '@shared/helpers'
import { Request, Response } from 'express'
import {
  resetPasswordWithOldPasswordSchema,
  resetPasswordWithTicketSchema
} from '@shared/validation'
import { updatePasswordWithTicket, updatePasswordWithUserId } from '@shared/queries'

import Boom from '@hapi/boom'
import bcrypt from 'bcryptjs'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { UpdateAccountData } from '@shared/types'

/**
 * Reset the password, either from a valid ticket or from a valid JWT and a valid password
 */
async function changePassword(req: Request, res: Response): Promise<unknown> {
  let password_hash: string

  if (req.body.ticket) {
    // Reset the password from { ticket, new_password }
    const { ticket, new_password } = await resetPasswordWithTicketSchema.validateAsync(req.body)

    await checkHibp(new_password)
    password_hash = await hashPassword(new_password)

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
  } else {
    // Reset the password from valid JWT and { old_password, new_password }
    const permission_variables = getPermissionVariablesFromCookie(req)
    const user_id = permission_variables['user-id']

    const { old_password, new_password } = await resetPasswordWithOldPasswordSchema.validateAsync(
      req.body
    )

    await checkHibp(new_password)
    // Search the account from the JWT's account id
    const { password_hash } = await selectAccountByUserId(user_id)
    // Check the old (current) password
    if (!(await bcrypt.compare(old_password, password_hash))) {
      throw Boom.unauthorized('Incorrect password.')
    }

    const newPasswordHash = await hashPassword(new_password)
    await request(updatePasswordWithUserId, {
      user_id,
      password_hash: newPasswordHash
    })
  }

  return res.status(204).send()
}

export default asyncWrapper(changePassword)
