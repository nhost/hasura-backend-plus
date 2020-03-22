import 'jest-extended'

import { AUTO_ACTIVATE } from '@shared/config'
import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { authenticator } from 'otplib'
import request from 'supertest'
import { selectUserByUsername } from '@shared/queries'
import { server } from '../../server'

/**
 * Store variables in memory.
 */
let jwtToken: string
let otpSecret: string
let userTicket: string

/**
 * Dummy user information.
 */
const username = 'jfxa8eybqi'
const email = 'jfxa8eybqi@kg2cuzbqaw.com'
const password = '1d5e6ceb-f42a-4f2e-b24d-8f1b925971c1'

/**
 * Create agent for global state.
 */
const agent = request.agent(server)

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

    const { status } = await agent.get(`/auth/user/activate?ticket=${ticket}`)

    expect(status).toBeOneOf([204, 302])
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

it('should revoke the token', async () => {
  const { status } = await agent
    .post('/auth/token/revoke')
    .set('Authorization', `Bearer ${jwtToken}`)

  expect(status).toEqual(204)
})

it('should return successfully', async () => {
  const { status } = await agent.post('/auth/password/forgot').send({ email })

  expect(status).toEqual(204)
})

it('should change the password', async () => {
  const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
  const ticket = hasuraData.private_user_accounts[0].user.ticket

  const { status } = await agent.post('/auth/password/reset').send({
    ticket,
    new_password: password
  })

  expect(status).toEqual(204)
})

it('should generate a secret', async () => {
  const { body, status } = await agent
    .post('/auth/mfa/generate')
    .set('Authorization', `Bearer ${jwtToken}`)

  /**
   * Save OTP secret to globally scoped variable.
   */
  otpSecret = body.otp_secret

  expect(status).toEqual(200)

  expect(body.image_url).toBeString()
  expect(body.otp_secret).toBeString()
})

it('should enable mfa for user', async () => {
  const { status } = await agent
    .post('/auth/mfa/enable')
    .set('Authorization', `Bearer ${jwtToken}`)
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})

it('should return a ticket', async () => {
  const { body, status } = await agent.post('/auth/login').send({ email, password })

  /**
   * Save ticket to globally scoped varaible.
   */
  userTicket = body.ticket

  expect(status).toEqual(200)

  expect(body.mfa).toBeTrue()
  expect(body.ticket).toBeString()
})

it('should sign the user in (mfa)', async () => {
  const { body, status } = await agent.post('/auth/mfa/totp').send({
    ticket: userTicket,
    code: authenticator.generate(otpSecret)
  })

  /**
   * Save JWT token to globally scoped varaible.
   */
  jwtToken = body.jwt_token

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should return successfully', async () => {
  const { status } = await agent.post('/auth/email/forgot').send({
    email,
    new_email: email
  })

  expect(status).toEqual(204)
})

it('should return successfully', async () => {
  const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
  const ticket = hasuraData.private_user_accounts[0].user.ticket

  const { status } = await agent.post('/auth/email/reset').send({ ticket })

  expect(status).toEqual(204)
})

it('should disable mfa for user', async () => {
  const { status } = await agent
    .post('/auth/mfa/disable')
    .set('Authorization', `Bearer ${jwtToken}`)
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})

it('should delete the user', async () => {
  const { status } = await agent
    .post('/auth/user/delete')
    .set('Authorization', `Bearer ${jwtToken}`)

  expect(status).toEqual(204)
})

server.close(() => console.log('Express server closed.'))
