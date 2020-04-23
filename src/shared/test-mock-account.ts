import { SuperTest, Test, agent } from 'supertest'
import { TestAccount, createAccount, deleteEmailsOfAccount } from '@shared/test-utils'

import { AUTO_ACTIVATE_NEW_USERS } from '@shared/config'
import Boom from '@hapi/boom'
import { HasuraAccountData } from '@shared/helpers'
import { JWT } from 'jose'
import { Token } from './jwt'
import { request as admin } from '@shared/request'
import { server } from '../start'
import { selectAccountByEmail } from '@shared/queries'

export let request: SuperTest<Test>

export let account: TestAccount

export const getUserId = (): string => {
  if (!account.token) {
    throw Boom.internal('No token found')
  }
  const decodedJwt = JWT.decode(account.token) as Token
  return decodedJwt['https://hasura.io/jwt/claims']['x-hasura-user-id']
}
// * Code that is executed before any jest test file that imports this file
beforeAll(async () => {
  request = agent(server) // * Create the SuperTest agent
  // * Create a mock account
  const { email, password } = createAccount()
  await request.post('/auth/register').send({ email, password })
  if (!AUTO_ACTIVATE_NEW_USERS) {
    const hasuraData = (await admin(selectAccountByEmail, { email })) as HasuraAccountData
    const ticket = hasuraData.auth_accounts[0].ticket
    await request.get(`/auth/account/activate?ticket=${ticket}`)
  }
  const {
    body: { jwt_token: token }
  } = await request.post('/auth/login').send({ email, password })
  // * Set the use variable so it is accessible to the jest test file
  account = {
    email,
    password,
    token
  }
})

// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  // * Delete the account
  await request.post('/auth/account/delete').set('Authorization', `Bearer ${account.token}`)
  // * Remove any message sent to this account
  await deleteEmailsOfAccount(account.email)
  await server.close()
})
