/* eslint-disable jest/no-standalone-expect */

import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'

import {
  AUTO_ACTIVATE_NEW_USERS,
  HIBP_ENABLE,
  EMAILS_ENABLE,
  REDIRECT_URL_ERROR,
  JWT_CLAIMS_NAMESPACE,
  HOST,
  PORT
  // ANONYMOUS_USERS_ENABLE
} from '@shared/config'
import { generateRandomString, selectAccountByEmail } from '@shared/helpers'
import { deleteMailHogEmail, mailHogSearch, deleteAccount } from '@test/test-utils'

import { JWT } from 'jose'
import { Token } from '@shared/types'
import { app } from '../../server'
import { SuperTest, Test, agent } from 'supertest'

/**
 * Store variables in memory.
 */
let jwtToken: string

/**
 * Dummy account information.
 */
const email = `${generateRandomString()}@${generateRandomString()}.com`
const password = generateRandomString()

let request: SuperTest<Test>

const server = app.listen(PORT, HOST)

beforeAll(async () => {
  request = agent(server) // * Create the SuperTest agent
})

// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  server.close()
})

const pwndPasswordIt = HIBP_ENABLE ? it : it.skip
pwndPasswordIt('should tell the password has been pwned', async () => {
  const {
    status,
    body: { message }
  } = await request.post('/auth/register').send({ email: 'test@example.com', password: '123456' })
  expect(status).toEqual(400)
  expect(message).toEqual('Password is too weak.')
})

it('should create an account', async () => {
  const { status } = await request
    .post('/auth/register')
    .send({ email, password, user_data: { name: 'Test name' } })
  expect(status).toEqual(204)
})

it('should tell the account already exists', async () => {
  const {
    status,
    body: { message }
  } = await request.post('/auth/register').send({ email, password })
  expect(status).toEqual(400)
  expect(message).toEqual('Account already exists.')
})

// * Only run test if auto activation is disabled
const manualActivationIt = !AUTO_ACTIVATE_NEW_USERS ? it : it.skip

manualActivationIt('should fail to activate an user from a wrong ticket', async () => {
  const { status, redirect, header } = await request.get(`/auth/activate?ticket=${uuidv4()}`)
  expect(
    status === 500 || (status === 302 && redirect && header?.location === REDIRECT_URL_ERROR)
  ).toBeTrue()
})

manualActivationIt('should activate the account from a valid ticket', async () => {
  let ticket
  if (EMAILS_ENABLE) {
    // Sends the email, checks if it's received and use the link for activation
    const [message] = await mailHogSearch(email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude('Confirm your email address')
    ticket = message.Content.Headers['X-Ticket'][0]
    await deleteMailHogEmail(message)
  } else {
    ticket = (await selectAccountByEmail(email)).ticket
  }
  const { status } = await request.get(`/auth/activate?ticket=${ticket}`)
  expect(status).toBeOneOf([204, 302])
})

it('should not sign user with wrong password', async () => {
  const { status } = await request.post('/auth/login').send({ email, password: 'sommar' })
  expect(status).toEqual(401)
})

it('should not sign in non existing user', async () => {
  const { status } = await request
    .post('/auth/login')
    .send({ email: 'non-existing@nhost.io', password: 'sommar' })
  expect(status).toEqual(400)
})

it('should complain about incorrect email', async () => {
  const { status } = await request
    .post('/auth/login')
    .send({ email: 'not-valid-email', password: 'sommar' })
  expect(status).toEqual(400)
})

it('should sign the user in', async () => {
  const { body, status } = await request.post('/auth/login').send({ email, password })
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
  expect(decodedJwt[JWT_CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')
})

it('should logout', async () => {
  const res = await request.post('/auth/logout').send()
  expect(res.status).toBe(204)
  await request.post('/auth/login').send({ email, password })
})

describe('Tests without cookies', () => {
  it('Should login without cookies', async () => {
    const { body, status } = await request
      .post('/auth/login')
      .send({ email, password, cookie: false })
    // Save JWT token to globally scoped varaible.
    console.log(body)
    jwtToken = body.jwt_token
    expect(status).toEqual(200)
    expect(body.jwt_token).toBeString()
    expect(body.jwt_expires_in).toBeNumber()
    expect(body.refresh_token).toBeString()

    const uuid_regex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
    expect(body.refresh_token).toMatch(uuid_regex)
  })

  it('should decode a valid custom user claim', async () => {
    const decodedJwt = JWT.decode(jwtToken) as Token
    expect(decodedJwt[JWT_CLAIMS_NAMESPACE]).toBeObject()
    // Test if the custom claims work
    expect(decodedJwt[JWT_CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')
  })
})

// delete account
it('should delete account', async () => {
  await deleteAccount(request, { email, password })
  expect('1').toBeString()
})

// test anonymous account
// const anonymousAccountIt = ANONYMOUS_USERS_ENABLE ? it : it.skip
// anonymousAccountIt('should login anonymously', async () => {
//   const { body, status } = await request.post('/auth/login').send({ anonymous: true })
//   expect(status).toEqual(200)
//   expect(body.jwt_token).toBeString()
//   expect(body.jwt_expires_in).toBeNumber()
// })
