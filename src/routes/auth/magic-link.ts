import { APPLICATION } from '@shared/config'
import { Response, Router } from 'express'
import Boom from '@hapi/boom'
import { accountOfRefreshToken, activateAccount } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { MagicLinkQuery, magicLinkQuery } from '@shared/validation'
import { AccountData, Session, UpdateAccountData, UserData } from '@shared/types'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { setRefreshToken } from '@shared/cookies'
import { ValidatedRequestSchema, ContainerTypes, createValidator, ValidatedRequest } from 'express-joi-validation'

async function magicLink({ query }: ValidatedRequest<Schema>, res: Response): Promise<unknown> {
  const { token, action } = query;

  const useCookie = typeof query.cookie !== 'undefined' ? query.cookie === true : true

  let refresh_token = token;

  if (action === 'sign-up') {
    const new_ticket = uuidv4()
    let hasuraData: UpdateAccountData

    try {
      hasuraData = await request<UpdateAccountData>(activateAccount, {
        ticket: token,
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

    const { affected_rows, returning } = hasuraData.update_auth_accounts

    if (!affected_rows) {
      console.error('Invalid or expired ticket')

      if (APPLICATION.REDIRECT_URL_ERROR) {
        return res.redirect(302, APPLICATION.REDIRECT_URL_ERROR)
      }
      /* istanbul ignore next */
      throw Boom.unauthorized('Invalid or expired token.')
    }

    refresh_token = await setRefreshToken(res, returning[0].id, useCookie)
  }

  const hasura_data = await request<{
    auth_refresh_tokens: { account: AccountData }[]
  }>(accountOfRefreshToken, {
    refresh_token,
  })

  const account = hasura_data.auth_refresh_tokens?.[0].account;

  if (!account) {
    throw Boom.unauthorized('Invalid or expired token.')
  }

  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry
  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    email: account.email,
    avatar_url: account.user.avatar_url
  }
  const session: Session = { jwt_token, jwt_expires_in, user }
  if (!useCookie) session.refresh_token = refresh_token

  if (action === 'log-in') {
    if (APPLICATION.REDIRECT_URL_SUCCESS) {
      return res.redirect(`${APPLICATION.REDIRECT_URL_SUCCESS}?refresh_token=${refresh_token}`)
    }

    return res.status(200).send('You have logged in')
  } else if (action === 'sign-up') {
    if(APPLICATION.REDIRECT_URL_SUCCESS) {
      return res.redirect(APPLICATION.REDIRECT_URL_SUCCESS.replace('JWT_TOKEN', token))
    } else
      return res.status(200).send('Your account has been activated. You can close this window and login')
  }

  res.send(session)
}

interface Schema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: MagicLinkQuery
}

export default (router: Router) => {
  router.get('/magic-link', createValidator().query(magicLinkQuery), asyncWrapper(magicLink))
}
