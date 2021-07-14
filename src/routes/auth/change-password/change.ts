import { Response } from 'express'
import bcrypt from 'bcryptjs'

import { asyncWrapper, checkHibp, hashPassword, selectAccountByUserId } from '@shared/helpers'
import { changePasswordFromOldSchema } from '@shared/validation'
import { updatePasswordWithUserId } from '@shared/queries'
import { request } from '@shared/request'
import { AccountData, RequestExtended } from '@shared/types'

/**
 * Change the password from the current one
 */
async function basicPasswordChange(req: RequestExtended, res: Response): Promise<unknown> {
  if (!req.permission_variables) {
    return res.boom.unauthorized('Not logged in')
  }

  const { 'user-id': user_id } = req.permission_variables

  const { old_password, new_password } = await changePasswordFromOldSchema.validateAsync(req.body)

  try {
    await checkHibp(new_password)
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  // Search the account from the JWT's account id
  let password_hash: AccountData['password_hash']
  try {
    const account = await selectAccountByUserId(user_id)
    password_hash = account.password_hash
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  // Check the old (current) password
  // but only if there is a previous password set
  if (password_hash && !(await bcrypt.compare(old_password, password_hash))) {
    return res.boom.unauthorized('Incorrect current password.')
  }

  let newPasswordHash: string
  try {
    newPasswordHash = await hashPassword(new_password)
  } catch (err) {
    return res.boom.internal(err.message)
  }

  await request(updatePasswordWithUserId, {
    user_id,
    password_hash: newPasswordHash
  })

  return res.status(204).send()
}

export default asyncWrapper(basicPasswordChange)
