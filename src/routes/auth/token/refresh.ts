import { asyncWrapper } from '@shared/helpers'
import { Response } from 'express'
import { selectRefreshToken, updateRefreshToken } from '@shared/queries'

import { newJwtExpiry, createHasuraJwt, generatePermissionVariables } from '@shared/jwt'
import { newRefreshExpiry, setCookie } from '@shared/cookies'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { AccountData, UserData, Session, RequestExtended } from '@shared/types'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function refreshToken({ refresh_token }: RequestExtended, res: Response): Promise<any> {
  if (!refresh_token || !refresh_token.value) {
    return res.boom.unauthorized('Invalid or expired refresh token.')
  }

  // get account based on refresh token
  const { auth_refresh_tokens } = await request<HasuraData>(selectRefreshToken, {
    refresh_token: refresh_token.value,
    current_timestamp: new Date()
  })

  if (!auth_refresh_tokens?.length) {
    return res.boom.unauthorized('Invalid or expired refresh token.')
  }

  // create a new refresh token
  const new_refresh_token = uuidv4()
  const { account } = auth_refresh_tokens[0]

  // delete old refresh token
  // and insert new refresh token
  try {
    await request(updateRefreshToken, {
      old_refresh_token: refresh_token.value,
      new_refresh_token_data: {
        account_id: account.id,
        refresh_token: new_refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (error) {
    return res.boom.badImplementation('Unable to set new refresh token')
  }

  const permission_variables = JSON.stringify(generatePermissionVariables(account))

  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry
  const user: UserData = {
    id: account.user.id,
    display_name: account.user.display_name,
    username: account.user.username,
    email: account.email,
    avatar_url: account.user.avatar_url,
    active: account.active
  }
  const session: Session = { jwt_token, jwt_expires_in, user }
  if (refresh_token.type === 'cookie') {
    setCookie(res, new_refresh_token, permission_variables)
  } else {
    session.refresh_token = new_refresh_token
  }
  res.send(session)
}

export default asyncWrapper(refreshToken)
