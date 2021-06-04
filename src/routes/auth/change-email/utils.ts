import { accountWithEmailExists } from '@shared/helpers'
import { emailResetSchema } from '@shared/validation'
import { RequestExtended } from '@shared/types'
import { Response } from 'express'

export const getRequestInfo = async (
  req: RequestExtended,
  res: Response
): Promise<{ user_id: string; new_email: string }> => {
  if (!req.permission_variables) {
    throw res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  // validate new email
  const { new_email } = await emailResetSchema.validateAsync(req.body)

  if (await accountWithEmailExists(new_email)) {
    throw res.boom.badRequest('Cannot use this email.')
  }

  return {
    user_id,
    new_email
  }
}
