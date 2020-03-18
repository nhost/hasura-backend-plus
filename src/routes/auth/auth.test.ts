import 'jest-extended'

import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { app } from '../../server'
import request from 'supertest'
import { selectUserByUsername } from '@shared/queries'

/**
 * Store JWT token in memory.
 */
let jwtToken: string

const { AUTO_ACTIVATE = false } = process.env

/**
 * Dummy user information.
 */
const username = 'jfxa8eybqi'
const email = 'jfxa8eybqi@kg2cuzbqaw.com'
const password = '1d5e6ceb-f42a-4f2e-b24d-8f1b925971c1'

/**
 * Create agent for global state.
 */
const agent = request.agent(app)

it('should create an account', async () => {
  const { status } = await agent.post('/auth/register').send({ email, password, username })

  expect(status).toEqual(204)
})

/**
 * Only run this test if `AUTO_ACTIVATE` is false.
 */
if (!AUTO_ACTIVATE) {
  it('should activate the user', async () => {
    const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
    const ticket = hasuraData.private_user_accounts[0].user.ticket

    const { status } = await agent.post('/auth/user/activate').send({ ticket })

    expect(status).toEqual(204)
  })
}

it('should sign the user in', async () => {
  const { body, status } = await agent.post('/auth/login').send({ email, password })

  /**
   * Save JWT token to globally scoped varaible.
   */
  jwtToken = body.jwt_token

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should refresh the token', async () => {
  const { body, status } = await agent.post('/auth/token/refresh')

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should remove the user', async () => {
  const { status } = await agent
    .post('/auth/user/remove')
    .set('Authorization', `Bearer ${jwtToken}`)

  expect(status).toEqual(204)
})
