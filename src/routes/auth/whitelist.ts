import { APPLICATION, HEADERS, REGISTRATION } from '@shared/config'
import { Request, Response, Router } from 'express'
import { asyncWrapper, isAllowedEmail } from '@shared/helpers'
import { WhitelistQuery, whitelistQuery } from '@shared/validation'
import { insertAllowedEmail } from '@shared/queries'
import { request } from '@shared/request'
import { emailClient } from '@shared/email'
import { ValidatedRequestSchema, ContainerTypes, createValidator } from 'express-joi-validation'

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

  if(!await isAllowedEmail(email)) {
    await request(insertAllowedEmail, {
      email
    })

    if(REGISTRATION.WHITELIST_SEND_INVITE) {
      if(!APPLICATION.EMAILS_ENABLED) {
        return res.boom.badImplementation('Emails have to be enabled when WHITELIST_SEND_INVITE=true')
      }

      await emailClient.send({
        template: 'invite',
        message: {
          to: email,
        },
        locals: {
          url: APPLICATION.SERVER_URL,
          app_url: APPLICATION.APP_URL,
          app_name: APPLICATION.APP_NAME,
          locale: APPLICATION.EMAILS_DEFAULT_LOCALE
        }
      })
    }
  }

  return res.status(204).send()
}

interface Schema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: WhitelistQuery
}

export default (router: Router) => {
  router.post('/whitelist', createValidator().body(whitelistQuery), asyncWrapper(whitelist))
}
