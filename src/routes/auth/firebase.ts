import Boom from '@hapi/boom'
import { DEFAULT_ALLOWED_USER_ROLES, DEFAULT_USER_ROLE } from '@shared/config'
import { setRefreshToken } from '@shared/cookies'
import { asyncWrapper, selectAccountByFirebaseUid } from '@shared/helpers'
import { createHasuraJwt, newJwtExpiry } from '@shared/jwt'
import { insertAccount } from '@shared/queries'
import { request } from '@shared/request'
import { InsertAccountData, RequestExtended } from '@shared/types'
import { Response } from 'express'
import admin from 'firebase-admin'

async function firebase(req: RequestExtended, res: Response): Promise<unknown> {
  const useCookie = typeof req.body.cookie !== 'undefined' ? req.body.cookie : true
  const { authorization } = req.headers
  if (!authorization) throw Boom.unauthorized()

  const token: string = authorization.replace('Bearer ', '')
  if (!token) throw Boom.unauthorized()

  let firebaseDecodedToken: admin.auth.DecodedIdToken
  try {
    firebaseDecodedToken = await admin.auth().verifyIdToken(token)
  } catch (e) {
    console.log(e)
    throw Boom.unauthorized('Invalid or expired token')
  }

  const { email, uid: firebase_uid } = firebaseDecodedToken
  let account = await selectAccountByFirebaseUid(firebase_uid)

  if (!account) {
    try {
      const {
        insert_auth_accounts: { returning }
      } = await request<InsertAccountData>(insertAccount, {
        account: {
          email,
          firebase_uid,
          active: true,
          default_role: DEFAULT_USER_ROLE,
          account_roles: {
            data: DEFAULT_ALLOWED_USER_ROLES.map((role) => ({ role }))
          },
          user: {
            data: { display_name: email }
          }
        }
      })
      if (!returning[0]) Boom.badImplementation('Error inserting user account')
      account = returning[0]
    } catch (e) {
      console.error('Error inserting user account')
      console.error(e)
      throw Boom.badImplementation('Error inserting user account')
    }
  }

  const refresh_token = await setRefreshToken(res, account.id, useCookie)

  const jwt_token = createHasuraJwt(account)
  const jwt_expires_in = newJwtExpiry

  // return
  if (useCookie) {
    res.send({
      jwt_token,
      jwt_expires_in
    })
  } else {
    res.send({
      jwt_token,
      jwt_expires_in,
      refresh_token
    })
  }

  return
}

export default asyncWrapper(firebase)
