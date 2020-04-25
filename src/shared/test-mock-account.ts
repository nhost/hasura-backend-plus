import { SuperTest, Test, agent } from 'supertest'
import { TestAccount, createAccount, deleteEmailsOfAccount } from '@shared/test-utils'

import { AUTO_ACTIVATE_NEW_USERS } from '@shared/config'
import { getClaims } from './jwt'
import { server } from '../start'
import { selectAccountByEmail } from './helpers'

export let request: SuperTest<Test>

export let account: TestAccount

export const getUserId = (): string => getClaims(account.token)['x-hasura-user-id']

// * Code that is executed before any jest test file that imports this file
beforeAll(async () => {
  request = agent(server) // * Create the SuperTest agent
  // * Create a mock account
  const { email, password } = createAccount()
  await request.post('/auth/register').send({ email, password })
  if (!AUTO_ACTIVATE_NEW_USERS) {
    const { ticket } = await selectAccountByEmail(email)
    await request.get(`/auth/account/activate?ticket=${ticket}`)
    await deleteEmailsOfAccount(email)
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

// * Code that is executed after any jest test file that imports this file
afterAll(async () => {
  // * Delete the account
  await request.post('/auth/account/delete').set('Authorization', `Bearer ${account.token}`)
  // * Remove any message sent to this account
  await deleteEmailsOfAccount(account.email)
  await server.close()
})
