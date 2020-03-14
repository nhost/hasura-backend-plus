import { Request, Response, Router } from 'express'
import { Token, asyncWrapper, verifyJwt } from '../../../shared/helpers'
import { selectUserById, updateOtpStatus } from '../../../shared/queries'

import Boom from '@hapi/boom'
import { authenticator } from 'otplib'
import { client } from '../../../shared/client'
import { mfaSchema } from '../../../shared/schema'

const enableHandler = async ({ headers, body }: Request, res: Response) => {
  let decodedToken: Token
  let hasuraData: { private_user_accounts: any[] }

  const { code } = await mfaSchema.validateAsync(body)

  try {
    decodedToken = await verifyJwt(headers.authorization)
  } catch (err) {
    throw Boom.unauthorized()
  }

  const user_id = decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']

  try {
    hasuraData = await client(selectUserById, { user_id })
  } catch (err) {
    throw Boom.badImplementation()
  }

  const { otp_secret, mfa_enabled } = hasuraData.private_user_accounts[0]

  if (mfa_enabled) {
    throw Boom.badRequest('MFA is already enabled.')
  }

  if (!authenticator.check(code, otp_secret)) {
    throw Boom.unauthorized('Invalid two-factor code.')
  }

  try {
    await client(updateOtpStatus, { user_id, mfa_enabled: true })
  } catch (err) {
    throw Boom.badImplementation()
  }

  return res.status(204).send()
}

export default Router().post('/', asyncWrapper(enableHandler))
