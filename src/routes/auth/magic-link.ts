import { APPLICATION } from '@shared/config'
import { Request, Response } from 'express'
import Boom from '@hapi/boom'
import { accountOfRefreshToken, activateAccount } from '@shared/queries'
import { asyncWrapper } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { magicLinkQuery } from '@shared/validation'
import { AccountData, UpdateAccountData } from '@shared/types'
import { setRefreshToken } from '@shared/helpers'

async function magicLink({ query }: Request, res: Response): Promise<unknown> {
  const { token, action } = await magicLinkQuery.validateAsync(query);

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

    refresh_token = await setRefreshToken(returning[0].id)
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

  // Redirect user with refresh token.
  // This is both for when users log in and register.
  return res.redirect(`${APPLICATION.REDIRECT_URL_SUCCESS}?refresh_token=${refresh_token}`)
}

export default asyncWrapper(magicLink)
