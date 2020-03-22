import 'jest-extended'
import request from 'supertest'

import { AUTO_ACTIVATE } from '@shared/config'
import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { selectUserByUsername } from '@shared/queries'
import { app } from '../../server'

/**
 * Store variables in memory.
 */
let jwtToken: string

/**
 * Dummy user information.
 */
const username = 'jfxa8eybqi'
const email = 'jfxa8eybqi@kg2cuzbqaw.com'
const password = '1d5e6ceb-f42a-4f2e-b24d-8f1b925971c1'

/**
 * Create agent for global state.
 */
const agent = request(app)

it('should create an account', async () => {
  const { status } = await agent.post('/auth/register').send({ email, password, username })
  expect(status).toEqual(204)
})

it('should tell me the account already exists', async () => {
  const {
    status,
    body: { message }
  } = await agent.post('/auth/register').send({ email, password, username })
  expect(status).toEqual(400)
  expect(message).toEqual('user already exists')
})

/**
 * Only run this test if `AUTO_ACTIVATE` is false.
 */
// TODO disable AUTO_ACTIVATE for tests
if (!AUTO_ACTIVATE) {
  it('should activate the user', async () => {
    const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
    const ticket = hasuraData.private_user_accounts[0].user.ticket
    const { status } = await agent.get(`/auth/user/activate?ticket=${ticket}`)
    expect(status).toEqual(302)
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

it('should delete the user', async () => {
  const { status } = await agent
    .post('/auth/user/delete')
    .set('Authorization', `Bearer ${jwtToken}`)
  expect(status).toEqual(204)
})

it('should tell me the email has been pwned', async () => {
  const {
    status,
    body: { message }
  } = await agent
    .post('/auth/register')
    .send({ email: 'test@example.com', password: '123456', username: 'pwnedemail' })
  expect(status).toEqual(400)
  expect(message).toEqual('password is too weak')
})
