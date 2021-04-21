import { Response } from 'express'

import { asyncWrapper } from '@shared/helpers'
import { changeEmailByUserId } from '@shared/queries'
import { request } from '@shared/request'

import { getRequestInfo } from './utils'
import { RequestExtended } from '@shared/types'
import { AUTHENTICATION } from '@shared/config'

async function requestChangeEmail(req: RequestExtended, res: Response): Promise<unknown> {
  if(AUTHENTICATION.VERIFY_EMAILS) {
    return res.boom.badImplementation(`Please set the VERIFY_EMAILS env variable to false to use the auth/change-email route.`)
  }

  const { user_id, new_email } = await getRequestInfo(req, res)

  // * Email verification is not activated - change email straight away
  await request(changeEmailByUserId, { user_id, new_email })

  return res.status(204).send()
}

export default asyncWrapper(requestChangeEmail)
