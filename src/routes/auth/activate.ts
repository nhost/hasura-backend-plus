import { APPLICATION } from '@shared/config'
import { Request, Response } from 'express'

import { activateAccount } from '@shared/queries'
import { asyncWrapper, getEndURLOperator } from '@shared/helpers'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { verifySchema } from '@shared/validation'
import { UpdateAccountData } from '@shared/types'
import { setRefreshToken } from '@shared/cookies'

async function activateUser({ query }: Request, res: Response): Promise<unknown> {
  if (!APPLICATION.REDIRECT_URL_SUCCESS) {
    return res.boom.badImplementation(
      'Environment variable REDIRECT_URL_SUCCESS must be set for activation to work.'
    )
  }

  let nextURL:string = ""
  if (query.nextURL) nextURL = query.nextURL as string
  if (nextURL) delete query.nextURL  

  let hasuraData: UpdateAccountData
  const useCookie = typeof query.cookie !== 'undefined' ? query.cookie === 'true' : true

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

  const refresh_token = await setRefreshToken(
    res,
    hasuraData.update_auth_accounts.returning[0].id,
    useCookie
  )

  const url_operator = getEndURLOperator({
    url: APPLICATION.REDIRECT_URL_SUCCESS
  })

  // Redirect user with refresh token.
  // This is both for when users log in and register.

  let redirectURL: string = `${APPLICATION.REDIRECT_URL_SUCCESS}${url_operator}refresh_token=${refresh_token}`

  if (nextURL) redirectURL += `&nextURL=${nextURL}`

  res.cookie('update_email_limit', null)

  return res.redirect(redirectURL)
}

export default asyncWrapper(activateUser)
