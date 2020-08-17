import { Response } from 'express'
import Boom from '@hapi/boom'
import bcrypt from 'bcryptjs'

import { asyncWrapper, checkHibp, hashPassword, selectAccountByUserId } from '@shared/helpers'
import { changePasswordFromOldSchema } from '@shared/validation'
import { updatePasswordWithUserId } from '@shared/queries'
import { request } from '@shared/request'
import { RequestExtended } from '@shared/types'

/**
 * Change the password from the current one
 */
async function basicPasswordChange(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    throw Boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  const { old_password, new_password } = await changePasswordFromOldSchema.validateAsync(req.body)

  await checkHibp(new_password)
  // Search the account from the JWT's account id
  const { password_hash } = await selectAccountByUserId(user_id)
  // Check the old (current) password
  if (!(await bcrypt.compare(old_password, password_hash))) {
    throw Boom.unauthorized('Incorrect current password.')
  }

  const newPasswordHash = await hashPassword(new_password)
  await request(updatePasswordWithUserId, {
    user_id,
    password_hash: newPasswordHash
  })

  return res.status(204).send()
}

export default asyncWrapper(basicPasswordChange)
