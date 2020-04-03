import { HasuraAccountData, asyncWrapper, checkHibp, hashPassword } from '@shared/helpers'
import { Request, Response } from 'express'
import { resetPasswordWithOldPasswordSchema, resetPasswordWithTicketSchema } from '@shared/schema'
import {
  selectAccountById,
  updatePasswordWithAccountId,
  updatePasswordWithTicket
} from '@shared/queries'

import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verify } from '@shared/jwt'

interface HasuraData {
  update_auth_accounts: { affected_rows: number }
}

/**
 * Reset the password, either from a valid ticket or from a valid JWT and a valid password
 */
async function resetPassword({ body, headers }: Request, res: Response): Promise<unknown> {
  let password_hash: string

  if (body.ticket) {
    // Reset the password from { ticket, new_password }
    const { ticket, new_password } = await resetPasswordWithTicketSchema.validateAsync(body, {})

    await checkHibp(new_password)
    password_hash = await hashPassword(new_password)

    try {
      const hasuraData = (await request(updatePasswordWithTicket, {
        ticket,
        password_hash,
        now: new Date(),
        new_ticket: uuidv4()
      })) as HasuraData

      const { affected_rows } = hasuraData.update_auth_accounts

      if (!affected_rows) {
        throw Boom.unauthorized('Invalid or expired ticket.')
      }
    } catch (err) {
      throw Boom.badImplementation()
    }
  } else {
    // Reset the password from valid JWT and { old_password, new_password }
    const decodedToken = verify(headers.authorization) // Verify the JWT
    const account_id = decodedToken?.['https://hasura.io/jwt/claims']['x-hasura-user-id']

    const { old_password, new_password } = await resetPasswordWithOldPasswordSchema.validateAsync(
      body
    )

    await checkHibp(new_password)

    // Search the account from the JWT's account id
    const hasuraData = (await request(selectAccountById, { account_id })) as HasuraAccountData

    if (hasuraData.auth_accounts && hasuraData.auth_accounts.length) {
      const { password_hash } = hasuraData.auth_accounts[0]

      // Check the old (current) password
      if (!(await argon2.verify(password_hash, old_password))) {
        throw Boom.unauthorized('Incorrect password.')
      }

      try {
        const newPasswordHash = await hashPassword(new_password)

        await request(updatePasswordWithAccountId, {
          account_id,
          password_hash: newPasswordHash
        })
      } catch (err) {
        throw Boom.badImplementation()
      }
    } else {
      throw Boom.badImplementation() // Account not found although JWT was valid
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(resetPassword)
