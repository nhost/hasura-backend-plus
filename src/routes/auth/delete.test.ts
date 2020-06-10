import 'jest-extended'

import { SuperTest, Test, agent } from 'supertest'

import { HOST, PORT } from '@shared/config'
import { registerAccount } from '@test/test-utils'

import { app } from '../../server'

let request: SuperTest<Test>

const server = app.listen(PORT, HOST)

// * Code that is executed before any jest test file that imports this file
beforeAll(async () => {
  request = agent(server) // * Create the SuperTest agent
  registerAccount(request)
})

// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  server.close()
})

it('should delete an account', async () => {
  await registerAccount(request)
  const { status } = await request.post('/auth/delete')
  expect(status).toEqual(204)
})
