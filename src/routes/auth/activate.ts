import { APPLICATION, REGISTRATION } from '@shared/config'
import { Response, Router } from 'express'

import { activateAccount } from '@shared/queries'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { VerifySchema, verifySchema } from '@shared/validation'
import { UpdateAccountData } from '@shared/types'
import { ValidatedRequestSchema, ContainerTypes, createValidator, ValidatedRequest } from 'express-joi-validation'
import { asyncWrapper } from '@shared/helpers'

async function activateUser({ query }: ValidatedRequest<Schema>, res: Response): Promise<unknown> {
  if (REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    return res.boom.badImplementation(`Please set the AUTO_ACTIVATE_NEW_USERS env variable to false to use the auth/activate route.`)
  }

  let hasuraData: UpdateAccountData

  const { ticket } = await verifySchema.validateAsync(query)

  const new_ticket = uuidv4()

  try {
    hasuraData = await request<UpdateAccountData>(activateAccount, {
      ticket,
      new_ticket,
      now: new Date()
    })
  } catch (err) /* istanbul ignore next */ {
    console.error(err)
    if (APPLICATION.REDIRECT_URL_ERROR) {
      return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
    }
    throw err
  }

  const { affected_rows } = hasuraData.update_auth_accounts

  if (!affected_rows) {
    console.error('Invalid or expired ticket')

    if (APPLICATION.REDIRECT_URL_ERROR) {
      return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
    }
    /* istanbul ignore next */
    return res.boom.unauthorized('Invalid or expired ticket.')
  }

  if(APPLICATION.REDIRECT_URL_SUCCESS) {
    res.redirect(APPLICATION.REDIRECT_URL_SUCCESS.replace('JWT_TOKEN', ticket))
  } else
    res.status(200).send('Your account has been activated. You can close this window and login')
}

interface Schema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: VerifySchema
}

export default (router: Router) => {
  router.get('/activate', createValidator().query(verifySchema), asyncWrapper(activateUser))
}
