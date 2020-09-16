import { SuperTest, Test, agent } from 'supertest'
import { TestAccount, registerAccount, deleteAccount } from '@test/test-utils'

import { HOST, PORT } from '@shared/config'
import { getClaims } from '../shared/jwt'
import { app } from '../server'

export let request: SuperTest<Test>

export let account: TestAccount

export const getUserId = (): string => getClaims(account.token)['x-hasura-user-id']
const server = app.listen(PORT, HOST)

// * Code that is executed before any jest test file that imports this file
beforeAll(async () => {
  request = agent(server) // * Create the SuperTest agent
  account = await registerAccount(request)
})

// * Code that is executed after any jest test file that imports this file
afterAll(async () => {
  await deleteAccount(request, account)
  server.close()
})
