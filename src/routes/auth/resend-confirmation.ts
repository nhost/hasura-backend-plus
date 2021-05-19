import { AUTHENTICATION, APPLICATION, REGISTRATION } from '@shared/config'
import { Request, Response } from 'express'
import { asyncWrapper, checkHibp, hashPassword, selectAccount } from '@shared/helpers'
import { newJwtExpiry, createHasuraJwt } from '@shared/jwt'

import { emailClient } from '@shared/email'
import { insertAccount } from '@shared/queries'
import { setRefreshToken } from '@shared/cookies'
import { registerSchema, magicLinkRegisterSchema } from '@shared/validation'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { InsertAccountData, UserData, Session, AccountData } from '@shared/types'

async function registerAccount(req: Request, res: Response): Promise<unknown> {
  if (REGISTRATION.AUTO_ACTIVATE_NEW_USERS) {
    return res.boom.badImplementation(`Please set the AUTO_ACTIVATE_NEW_USERS env variable to false to use the auth/activate route.`)
  }

  const body = req.body

  let account: AccountData | undefined;

  if (!(account = await selectAccount(body))) {
    return res.boom.badRequest('Account does not exist.')
  } else if (account!.active) {
    return res.boom.badRequest('Account already activated.')
  }

  const ticket = uuidv4()
  const now = new Date()
  const ticket_expires_at = new Date()
  ticket_expires_at.setTime(now.getTime() + 60 * 60 * 1000) // active for 60 minutes

  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    email: account.email,
    avatar_url: account.user.avatar_url
  }

  if (!APPLICATION.EMAILS_ENABLE) {
    return res.boom.badImplementation('SMTP settings unavailable')
  }

  // use display name from `user_data` if available
  const display_name = user.display_name || user.email;

  try {
    await emailClient.send({
      template: 'activate-account',
      message: {
        to: user.email,
        headers: {
          'x-ticket': {
            prepared: true,
            value: ticket
          }
        }
      },
      locals: {
        display_name,
        ticket,
        url: APPLICATION.SERVER_URL
      }
    })
  } catch (err) {
    console.error(err)
    return res.boom.badImplementation()
  }

  const session: Session = { jwt_token: null, jwt_expires_in: null, user }
  return res.send(session)
}

export default asyncWrapper(registerAccount)