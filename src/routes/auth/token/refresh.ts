import { asyncWrapper } from '@shared/helpers'
import { Request, Response } from 'express'
import { selectRefreshToken, updateRefreshToken } from '@shared/queries'

import Boom from '@hapi/boom'
import { COOKIE_SECRET } from '@shared/config'
import {
  newJwtExpiry,
  newRefreshExpiry,
  createHasuraJwt,
  setCookie,
  generatePermissionVariables
} from '@shared/jwt'
import { request } from '@shared/request'
import { v4 as uuidv4 } from 'uuid'
import { AccountData } from '@shared/types'

interface HasuraData {
  auth_refresh_tokens: { account: AccountData }[]
}

async function refreshToken({ cookies, signedCookies }: Request, res: Response): Promise<unknown> {
  const { refresh_token } = COOKIE_SECRET ? signedCookies : cookies

  if (!refresh_token) {
    throw Boom.unauthorized('Invalid or expired refresh token.')
  }

  // get account based on refresh token
  const { auth_refresh_tokens } = await request<HasuraData>(selectRefreshToken, {
    refresh_token,
    current_timestamp: new Date()
  })

  if (!auth_refresh_tokens?.length) {
    throw Boom.unauthorized('Invalid or expired refresh token.')
  }

  // create a new refresh token
  const new_refresh_token = uuidv4()
  const { account } = auth_refresh_tokens[0]

  // delete old refresh token
  // and insert new refresh token
  try {
    await request(updateRefreshToken, {
      old_refresh_token: refresh_token,
      new_refresh_token_data: {
        account_id: account.id,
        refresh_token: new_refresh_token,
        expires_at: new Date(newRefreshExpiry())
      }
    })
  } catch (error) {
    throw Boom.badImplementation('Unable to set new refresh token')
  }

  const permission_variables = JSON.stringify(generatePermissionVariables(account))

  setCookie(res, new_refresh_token, permission_variables)

  return res.send({
    jwt_token: createHasuraJwt(account),
    jwt_expires_in: newJwtExpiry
  })
}

export default asyncWrapper(refreshToken)
