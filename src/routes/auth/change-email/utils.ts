import { selectAccountByEmail } from '@shared/helpers'
import { emailResetSchema } from '@shared/validation'
import { RequestExtended } from '@shared/types'
import { Response } from 'express'

export const getRequestInfo = async (
  req: RequestExtended,
  res: Response
): Promise<{ user_id: string | number; new_email: string }> => {
  if (!req.permission_variables) {
    throw res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  // validate new email
  const { new_email } = await emailResetSchema.validateAsync(req.body)

  console.log(req.body)

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
    throw res.boom.badRequest('Cannot use this email.')
  }
  return {
    user_id,
    new_email
  }
}
