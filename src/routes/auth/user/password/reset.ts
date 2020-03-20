import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import argon2 from 'argon2'
import { pwnedPassword } from 'hibp'
import { v4 as uuidv4 } from 'uuid'

import { HIBP_ENABLED } from '@shared/config'
import { asyncWrapper, HasuraUserData } from '@shared/helpers'
import { resetPasswordWithTicketSchema, resetPasswordWithOldPasswordSchema } from '@shared/schema'
import { request } from '@shared/request'
import { updatePasswordWithTicket, selectUserById, updatePasswordWithUserId } from '@shared/queries'
import { verify } from '@shared/jwt'

interface HasuraData {
  update_private_user_accounts: { affected_rows: number }
}

const checkHibp = async (password: string): Promise<void> => {
  if (HIBP_ENABLED) {
    const pwned = await pwnedPassword(password)

    if (pwned) {
      throw Boom.badRequest('Password is too weak.')
    }
  }
}

const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password)
  } catch (err) {
    throw Boom.badImplementation()
  }
}

/**
 * * Reset the password, either from a valid ticket or from a valid JWT and a valid password
 */
async function resetPassword({ body, headers }: Request, res: Response): Promise<unknown> {
  let password_hash: string

  if (body.ticket) {
    // * Reset the password from { ticket, new_password }
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
      const { affected_rows } = hasuraData.update_private_user_accounts
      if (affected_rows === 0) {
        throw Boom.unauthorized('Invalid or expired ticket.')
      }
    } catch (err) {
      throw Boom.badImplementation()
    }
  } else {
    // * Reset the password from valid JWT and { old_password, new_password }
    const decodedToken = verify(headers.authorization) // Verify the JWT
    const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']
    const { old_password, new_password } = await resetPasswordWithOldPasswordSchema.validateAsync(
      body
    )
    await checkHibp(new_password)
    // Search the user from the JWT's user id
    const hasuraData = (await request(selectUserById, { user_id })) as HasuraUserData
    if (hasuraData.private_user_accounts && hasuraData.private_user_accounts.length) {
      const { password_hash } = hasuraData.private_user_accounts[0]
      // Check the old (current) password
      if (!(await argon2.verify(password_hash, old_password))) {
        throw Boom.unauthorized('Wrong password.')
      }
      try {
        const newPasswordHash = await hashPassword(new_password)
        await request(updatePasswordWithUserId, {
          user_id,
          password_hash: newPasswordHash
        })
      } catch (err) {
        throw Boom.badImplementation()
      }
    } else {
      throw Boom.badImplementation() // User not found although JWT was valid
    }
  }

  return res.status(204).send()
}

export default asyncWrapper(resetPassword)
