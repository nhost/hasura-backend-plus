import { APPLICATION, HEADERS, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, isWhitelistedEmail } from '@shared/helpers'
import { whitelistQuery } from '@shared/validation'
import { insertWhitelistedEmail } from '@shared/queries'
import { request } from '@shared/request'

async function whitelist(req: Request, res: Response): Promise<unknown> {
  const body = req.body

  const {
    email
  } = await whitelistQuery.validateAsync(body)

  if(!REGISTRATION.WHITELIST) {
    return res.boom.notImplemented('Whitelist is disabled')
  }

  if(req.headers[HEADERS.ADMIN_SECRET_HEADER] !== APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET) {
    return res.boom.unauthorized('Incorrect admin secret')
  }

  if(!await isWhitelistedEmail(email)) {
    await request(insertWhitelistedEmail, {
      email
    })
  }

  return res.status(204).send()
}

export default asyncWrapper(whitelist)
