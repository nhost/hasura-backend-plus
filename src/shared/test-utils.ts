import { HasuraAccountData, generateRandomString } from '@shared/helpers'
import { SuperTest, Test, agent } from 'supertest'

import { AUTO_ACTIVATE } from '@shared/config'
import { request as admin } from '@shared/request'
import { app } from '../server'
import { deleteEmailsOfAccount } from '@shared/test-email'
import { selectAccountByEmail } from '@shared/queries'

export let request: SuperTest<Test>

interface TestAccount {
  email: string
  password: string
  token?: string
}

export const createAccount = (): TestAccount => {
  return {
    email: `${generateRandomString()}@${generateRandomString()}.com`,
    password: generateRandomString()
  }
}

export let account: TestAccount

// * Code that is executed before any jest test file that imports test-utiles
beforeAll(async () => {
  request = agent(app) // * Create the SuperTest agent
  // * Create a mock account
  const { email, password } = createAccount()
  await request.post('/auth/register').send({ email, password })
  if (!AUTO_ACTIVATE) {
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
})
