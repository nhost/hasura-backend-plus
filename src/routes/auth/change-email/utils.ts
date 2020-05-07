import { Request } from 'express'
import { selectAccountByEmail } from '@shared/helpers'
import { emailResetSchema } from '@shared/validation'
import { getClaims } from '@shared/jwt'
import Boom from '@hapi/boom'

export const getRequestInfo = async ({
  body,
  headers
}: Request): Promise<{ user_id: string; new_email: string }> => {
  // get current user_id
  const user_id = getClaims(headers.authorization)['x-hasura-user-id']

  // validate new email
  const { new_email } = await emailResetSchema.validateAsync(body)

  // make sure new_email is not attached to an account yet
  let account_exists = true
  try {
    await selectAccountByEmail(new_email)
    // Account using new_email already exists - pass
  } catch {
    // No existing account is using the new email address. Good!
    account_exists = false
  }

  if (account_exists) {
    throw Boom.badRequest('Cannot use this email.')
  }
  return { user_id, new_email }
}
