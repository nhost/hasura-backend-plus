/* eslint-disable jest/no-standalone-expect */

import 'jest-extended'

import { AUTO_ACTIVATE_NEW_USERS, HIBP_ENABLE, SERVER_URL, SMTP_ENABLE } from '@shared/config'
import { HasuraAccountData, generateRandomString } from '@shared/helpers'
import { deleteMailHogEmail, mailHogSearch } from '@shared/test-utils'

import { JWT } from 'jose'
import { Token } from '@shared/jwt'
import { request as admin } from '@shared/request'
import { server } from '../../start'
import request from 'supertest'
import { selectAccountByEmail } from '@shared/queries'

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
const agent = request(server)
// * Code that is executed after any jest test file that imports test-utiles

afterAll(async () => {
  await server.close()
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

/**
 * * Only run this test if auto activation is disabled
 */
const manualActivationIt = !AUTO_ACTIVATE_NEW_USERS ? it : it.skip
manualActivationIt('should activate the account', async () => {
  let activateLink: string
  if (SMTP_ENABLE) {
    // Sends the email, checks if it's received and use the link for activation
    const [message] = await mailHogSearch(email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude('Confirm your email address')
    activateLink = message.Content.Headers['X-Activate-Link'][0].replace(`${SERVER_URL}`, '')
    await deleteMailHogEmail(message)
  } else {
    const hasuraData = (await admin(selectAccountByEmail, { email })) as HasuraAccountData
    const ticket = hasuraData.auth_accounts[0].ticket
    activateLink = `/auth/account/activate?ticket=${ticket}`
  }
  const { status } = await agent.get(activateLink)
  expect(status).toBeOneOf([204, 302])
})

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

it('should decode a valid custom user claim', async () => {
  const decodedJwt = JWT.decode(jwtToken) as Token
  expect(decodedJwt['https://hasura.io/jwt/claims']).toBeObject()
  // Test if the custom claims work
  expect(decodedJwt['https://hasura.io/jwt/claims']['x-name']).toEqual('Test name')
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
