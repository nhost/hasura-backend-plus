import { APPLICATION, HEADERS, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, isAllowedEmail } from '@shared/helpers'
import { allowlistQuery } from '@shared/validation'
import { insertAllowedEmail } from '@shared/queries'
import { request } from '@shared/request'

async function allowlist(req: Request, res: Response): Promise<unknown> {
  const body = req.body

  const {
    email
  } = await allowlistQuery.validateAsync(body)

  if(!REGISTRATION.ALLOWLIST) {
    return res.boom.notImplemented('Allowlist is disabled')
  }

  if(req.headers[HEADERS.ADMIN_SECRET_HEADER] !== APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET) {
    return res.boom.unauthorized('Incorrect admin secret')
  }

  if(!await isAllowedEmail(email)) {
    await request(insertAllowedEmail, {
      email
    })
  }

  return res.status(204).send()
}

export default asyncWrapper(allowlist)
