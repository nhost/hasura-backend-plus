/* eslint-disable jest/no-standalone-expect */
import 'jest-extended'

import { AUTO_ACTIVATE, HIBP_ENABLED, SERVER_URL, SMTP_ENABLED } from '@shared/config'
import { createUser, deleteMailHogEmail, mailHogSearch } from '@shared/test-utils'

import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { app } from '../../server'
import request from 'supertest'
import { selectUserByUsername } from '@shared/queries'

// eslint-disable-next-line @typescript-eslint/no-empty-function
console.error = function (): void {} // Disable the errors that will be raised by the tests

/**
 * Store variables in memory.
 */
let jwtToken: string

/**
 * Dummy user information.
 */
const { username, email, password } = createUser()
console.log(username, email, password)

/**
 * Create agent for global state.
 */
const agent = request(app)

it('should create an account', async () => {
  const { status } = await agent.post('/auth/register').send({ email, password, username })
  expect(status).toEqual(204)
})

it('should tell the account already exists', async () => {
  const {
    status,
    body: { message }
  } = await agent.post('/auth/register').send({ email, password, username })
  expect(status).toEqual(400)
  expect(message).toEqual('user already exists')
})

/**
 * * Only run this test if auto activation is disabled
 */
const manualActivationIt = !AUTO_ACTIVATE ? it : it.skip
manualActivationIt('should activate the user', async () => {
  let activateLink: string
  if (SMTP_ENABLED) {
    // Sends the email, checks if it's received and use the link for activation
    const [message] = await mailHogSearch(email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude('Confirm your email address')
    activateLink = message.Content.Headers['X-Activate-Link'][0].replace(`${SERVER_URL}`, '')
    await deleteMailHogEmail(message)
  } else {
    const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
    const ticket = hasuraData.private_user_accounts[0].user.ticket
    activateLink = `/auth/user/activate?ticket=${ticket}`
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

it('should delete the user', async () => {
  const { status } = await agent
    .post('/auth/user/delete')
    .set('Authorization', `Bearer ${jwtToken}`)
  expect(status).toEqual(204)
})

const pwndPasswordIt = HIBP_ENABLED ? it : it.skip
pwndPasswordIt('should tell the password has been pwned', async () => {
  const {
    status,
    body: { message }
  } = await agent
    .post('/auth/register')
    .send({ email: 'test@example.com', password: '123456', username: 'pwneduser' })
  expect(status).toEqual(400)
  expect(message).toEqual('Password is too weak.')
})
