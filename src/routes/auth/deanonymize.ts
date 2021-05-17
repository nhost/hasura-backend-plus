import { Response } from 'express'
import { AUTHENTICATION } from "@shared/config";
import { accountIsAnonymous, accountWithEmailExists, asyncWrapper, checkHibp, hashPassword } from "@shared/helpers";
import { deanonymizeSchema } from '@shared/validation';
import { RequestExtended } from '@shared/types';
import { request } from '@shared/request';
import { deanonymizeByUserId } from '@shared/queries';

async function deanonymizeAccount(req: RequestExtended, res: Response): Promise<unknown> {
  const body = req.body

  if(AUTHENTICATION.ANONYMOUS_USERS_ENABLE) {
    return res.boom.badImplementation(`Please set the ANONYMOUS_USERS_ENABLE env variable to true to use the auth/deanonymize route.`)
  }

  if (!req.permission_variables || !accountIsAnonymous(req.permission_variables['user-id'])) {
    return res.boom.unauthorized('Unable to deanonymize account')
  }

  const {
    email,
    password,
  } = await deanonymizeSchema.validateAsync(body)

  try {
    await checkHibp(password)
  } catch (err) {
    return res.boom.badRequest(err.message)
  }

  let passwordHash: string
  try {
    passwordHash = await hashPassword(password)
  } catch (err) {
    return res.boom.internal(err.message)
  }

  if (accountWithEmailExists(email)) {
    throw res.boom.badRequest('Cannot use this email.')
  }

  await request(deanonymizeByUserId, {
    user_id: req.permission_variables['user-id'],
    email,
    password_hash: passwordHash
  })

  return res.status(204).send()
}

export default asyncWrapper(deanonymizeAccount)
