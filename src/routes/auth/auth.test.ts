/* eslint-disable jest/no-standalone-expect */

import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'

import {
  AUTO_ACTIVATE_NEW_USERS,
  HIBP_ENABLE,
  SMTP_ENABLE,
  REDIRECT_URL_ERROR,
  JWT_CLAIMS_NAMESPACE,
  PORT,
  AUTH_ANONYMOUS_USERS_ACTIVE
} from '@shared/config'
import { generateRandomString, selectAccountByEmail } from '@shared/helpers'
import { deleteMailHogEmail, mailHogSearch, registerAccount, deleteAccount } from '@test/test-utils'

import { JWT } from 'jose'
import { Token } from '@shared/types'
import { app } from '../../server'
import request from 'supertest'

/**
 * Store variables in memory.
 */
let jwtToken: string

/**
 * Dummy account information.
 */
const email = `${generateRandomString()}@${generateRandomString()}.com`
const password = generateRandomString()

/**
 * Create agent for global state.
 */
const server = app.listen(PORT)
const agent = request(server)
// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  server.close()
})

it('should create an account', async () => {
  const { status } = await agent
    .post('/auth/register')
    .send({ email, password, user_data: { name: 'Test name' } })
  expect(status).toEqual(204)
})

it('should tell the account already exists', async () => {
  const {
    status,
    body: { message }
  } = await agent.post('/auth/register').send({ email, password })
  expect(status).toEqual(400)
  expect(message).toEqual('Account already exists.')
})

// * Only run test if auto activation is disabled
const manualActivationIt = !AUTO_ACTIVATE_NEW_USERS ? it : it.skip

manualActivationIt('should fail to activate an user from a wrong ticket', async () => {
  const { status, redirect, header } = await agent.get(`/auth/account/activate?ticket=${uuidv4()}`)
  expect(
    status === 500 || (status === 302 && redirect && header?.location === REDIRECT_URL_ERROR)
  ).toBeTrue()
})

manualActivationIt('should activate the account from a valid ticket', async () => {
  let ticket
  if (SMTP_ENABLE) {
    // Sends the email, checks if it's received and use the link for activation
    const [message] = await mailHogSearch(email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude('Confirm your email address')
    ticket = message.Content.Headers['X-Ticket'][0]
    await deleteMailHogEmail(message)
  } else {
    ticket = (await selectAccountByEmail(email)).ticket
  }
  const { status } = await agent.get(`/auth/account/activate?ticket=${ticket}`)
  expect(status).toBeOneOf([204, 302])
})

it('should sign the user in', async () => {
  const { body, status } = await agent.post('/auth/login').send({ email, password })
  // Save JWT token to globally scoped varaible.
  jwtToken = body.jwt_token
  expect(status).toEqual(200)
  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should decode a valid custom user claim', async () => {
  const decodedJwt = JWT.decode(jwtToken) as Token
  expect(decodedJwt[JWT_CLAIMS_NAMESPACE]).toBeObject()
  // Test if the custom claims work
  expect(decodedJwt[JWT_CLAIMS_NAMESPACE]['x-name']).toEqual('Test name')
})

it('should delete the account', async () => {
  const { status } = await agent
    .post('/auth/account/delete')
    .set('Authorization', `Bearer ${jwtToken}`)
  expect(status).toEqual(204)
})

const pwndPasswordIt = HIBP_ENABLE ? it : it.skip
pwndPasswordIt('should tell the password has been pwned', async () => {
  const {
    status,
    body: { message }
  } = await agent.post('/auth/register').send({ email: 'test@example.com', password: '123456' })
  expect(status).toEqual(400)
  expect(message).toEqual('Password is too weak.')
})

const anonymousAccountIt = AUTH_ANONYMOUS_USERS_ACTIVE ? it : it.skip
anonymousAccountIt('should login anonymously', async () => {
  const { body, status } = await agent.post('/auth/login').send({ anonymous: true })
  expect(status).toEqual(200)
  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should logout', async () => {
  // TODO : review this test, including cookies
  const account = await registerAccount(agent)
  const res = await agent.post('/auth/logout').send()
  expect(res.status).toBe(204)
  await deleteAccount(agent, account)
})

// TODO test cookies
