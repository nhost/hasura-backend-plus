import { APPLICATION } from '@shared/config'
import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import { accountOfRefreshToken, activateAccount } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { magicLinkQuery } from '@shared/validation'
import { AccountData, Session, UpdateAccountData, UserData } from '@shared/types'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { setRefreshToken } from '@shared/helpers'

async function magicLink({ query }: Request, res: Response): Promise<unknown> {
  const { token, action } = await magicLinkQuery.validateAsync(query);

  let refresh_token = token;
  let permission_variables: string | undefined

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

    [refresh_token, permission_variables] = await setRefreshToken(returning[0].id)
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
  const session: Session = { jwt_token, jwt_expires_in, user, refresh_token, permission_variables }

  if (action === 'log-in') {
    if (APPLICATION.REDIRECT_URL_SUCCESS) {
      return res.redirect(`${APPLICATION.REDIRECT_URL_SUCCESS}?refresh_token=${refresh_token}`)
    }

    res.status(200).send('You have logged in')
  } else if (action === 'sign-up') {
    if (APPLICATION.REDIRECT_URL_SUCCESS) {
      return res.redirect(APPLICATION.REDIRECT_URL_SUCCESS)
    }

    if(APPLICATION.REDIRECT_URL_SUCCESS) {
      res.redirect(APPLICATION.REDIRECT_URL_SUCCESS.replace('JWT_TOKEN', token))
    } else
      res.status(200).send('Your account has been activated. You can close this window and login')
  } else {
    res.status(400);
  }

  res.send(session)
}

export default asyncWrapper(magicLink)
