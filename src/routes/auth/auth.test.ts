/* eslint-disable jest/no-standalone-expect */

import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'

import { APPLICATION, JWT as CONFIG_JWT, REGISTRATION, HEADERS } from '@shared/config'
import { generateRandomString, selectAccountByEmail } from '@shared/helpers'
import { deleteMailHogEmail, mailHogSearch, registerAccount } from '@test/test-utils'

import { JWT } from 'jose'
import { Token } from '@shared/types'
import { app } from '../../server'
import { SuperTest, Test, agent } from 'supertest'
import { end, saveJwt, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

import { Response } from 'superagent'

import { withEnv } from '../../test/test-utils'

/**
 * Store variables in memory.
 */
let jwtToken: string

/**
 * Dummy account information.
 */
const email = `${generateRandomString()}@${generateRandomString()}.com`
const password = generateRandomString()
const magicLinkEmail = `${generateRandomString()}@${generateRandomString()}.com`

let request: SuperTest<Test>

const server = app.listen(APPLICATION.PORT, APPLICATION.HOST)

beforeAll(() => {
  request = agent(server) // * Create the SuperTest agent
})

// * Code that is executed after any jest test file that imports test-utiles
afterAll(() => {
  server.close()
})

function errorMessageEqual(msg: string) {
  return (res: Response) => {
    expect(res.body.message).toEqual(msg)
  }
}

const pwndPasswordIt = REGISTRATION.HIBP_ENABLE ? it : it.skip
pwndPasswordIt('should tell the password has been pwned', (done) => {
  request.post('/auth/register')
    .send({ email: 'test@example.com', password: '123456' })
    .expect(400)
    .expect(errorMessageEqual('Password is too weak.'))
    .end(end(done))
})

it('should create an account', (done) => {
  request
    .post('/auth/register')
    .send({ email, password, user_data: { name: 'Test name' } })
    .expect(200)
    .end(end(done))
})

it('should create an account without a password when magic link login is enabled', async () => {
  await withEnv({
    ENABLE_MAGIC_LINK: 'true'
  }, request, async () => {
    const { body, status } = await request
      .post('/auth/register')
      .send({ email: magicLinkEmail, user_data: { name: 'Test name' } })

    expect(status).toEqual(200)
    expect(body.jwt_token).toBeNull()
    expect(body.jwt_expires_in).toBeNull()
    expect(body.user).toBeTruthy()

    const [message] = await mailHogSearch(magicLinkEmail)
    expect(message).toBeTruthy()
    const token = message.Content.Headers['X-Token'][0]
    await deleteMailHogEmail(message)

    {
      const { status } = await request.get(`/auth/magic-link?action=sign-up&token=${token}`)
      expect(status).toBe(302)
    }
  })
})

it('should not create an account without a password when magic link login is disabled', (done) => {
  withEnv({
    ENABLE_MAGIC_LINK: 'false'
  }, request, async () => {
    request
      .post('/auth/register')
      .send({ email: magicLinkEmail, user_data: { name: 'Test name' } })
      .expect(400)
      .end(end(done))
  })
})

it('should fail to create account with unallowed role', (done) => {
  request.post('/auth/register')
    .send({
      email: 'test1@nhost.io',
      password,
      user_data: { name: 'Test name' },
      register_options: {
        allowed_roles: ['user', 'me', 'super-admin']
      }
    })
    .expect(400)
    .end(end(done))
})

it('should fail to create accunt with default_role that does not overlap allowed_roles', (done) => {
  request.post('/auth/register')
    .send({
      email: 'test2@nhost.io',
      password,
      user_data: { name: 'Test name' },
      register_options: {
        default_role: 'editor',
        allowed_roles: ['user', 'me']
      }
    })
    .expect(400)
    .end(end(done))
})

it('should create account with default_role that is in the ALLOWED_USER_ROLES variable', (done) => {
  request.post('/auth/register')
    .send({
      email: 'test3@nhost.io',
      password,
      user_data: { name: 'Test name' },
      register_options: {
        default_role: 'editor'
      }
    })
    .expect(200)
    .end(end(done))
})

it('should register account with default_role and allowed_roles set', (done) => {
  request.post('/auth/register')
    .send({
      email: 'test4@nhost.io',
      password,
      user_data: { name: 'Test name' },
      register_options: {
        default_role: 'user',
        allowed_roles: ['user', 'me']
      }
    })
    .expect(200)
    .end(end(done))
})

it('should tell the account already exists', (done) => {
  request
    .post('/auth/register').send({ email, password })
    .expect(400)
    .expect(errorMessageEqual('Account already exists.'))
    .end(end(done))
})

// * Only run test if auto activation is disabled
const manualActivationIt = !REGISTRATION.AUTO_ACTIVATE_NEW_USERS ? it : it.skip

manualActivationIt('should fail to activate an user from a wrong ticket', async () => {
  const { status, redirect, header } = await request.get(`/auth/activate?ticket=${uuidv4()}`)
  expect(
    status === 500 || (status === 302 && redirect && header?.location === APPLICATION.REDIRECT_URL_ERROR)
  ).toBeTrue()
})

manualActivationIt('should activate the account from a valid ticket', async () => {
  let ticket
  if (APPLICATION.EMAILS_ENABLE) {
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

it('should not sign user with wrong password', (done) => {
  request
    .post('/auth/login')
    .send({ email, password: 'sommar' })
    .expect(401)
    .end(end(done))
})

it('should not sign in non existing user', (done) => {
  request
    .post('/auth/login')
    .send({ email: 'non-existing@nhost.io', password: 'sommar' })
    .expect(400)
    .end(end(done))
})

it('should complain about incorrect email', (done) => {
  request
    .post('/auth/login')
    .send({ email: 'not-valid-email', password: 'sommar' })
    .expect(400)
    .end(end(done))
})

it('should sign the user in', (done) => {
  request.post('/auth/login')
    .send({ email, password })
    .expect(validJwt())
    .expect(200)
    .expect(saveJwt(j => jwtToken = j))
    .end(end(done))
})

it('should sign the user in without password when magic link is enabled', async () => {
  await withEnv({
    ENABLE_MAGIC_LINK: 'true'
  }, request, async () => {
    const { body, status } = await request.post('/auth/login').send({ email: magicLinkEmail })
    expect(status).toEqual(200)
    expect(body.magicLink).toBeTrue()

    const [message] = await mailHogSearch(magicLinkEmail)
    expect(message).toBeTruthy()
    const token = message.Content.Headers['X-Token'][0]
    await deleteMailHogEmail(message)

    {
      const { status } = await request.get(`/auth/magic-link?action=log-in&token=${token}`)
      expect(status).toBe(302)
    }
  })
})

it('should not sign the user in without password when magic link is disabled', (done) => {
  withEnv({
    ENABLE_MAGIC_LINK: 'false'
  }, request, async () => {
    request
      .post('/auth/login')
      .send({ email: magicLinkEmail })
      .expect(400)
      .end(end(done))
  });
})

it('should not sign user in with invalid admin secret', (done) => {
  request
    .post('/auth/login')
    .set(HEADERS.ADMIN_SECRET_HEADER, 'invalidsecret')
    .send({ email, password: 'invalidpassword' })
    .expect(401)
    .end(end(done))
})

it('should sign in user with valid admin secret', (done) => {
  request
    .post('/auth/login')
    .set(HEADERS.ADMIN_SECRET_HEADER, APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET as string)
    .send({ email, password: 'invalidpassword' })
    .expect(200)
    .expect(validJwt())
    .end(end(done))
})

it('should decode a valid custom user claim', () => {
  const decodedJwt = JWT.decode(jwtToken) as Token
  expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]).toBeObject()
  // Test if the custom claims work
  expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')
})

it('should logout', (done) => {
  request.post('/auth/logout')
    .send()
    .expect(204)
    .end(end(done))
})

describe('Tests without cookies', () => {
  it('Should login without cookies', (done) => {
    request
      .post('/auth/login')
      .send({ email, password, cookie: false })
      .expect(saveJwt(j => jwtToken = j))
      .expect(validJwt())
      .expect(validRefreshToken())
      .end(end(done))
  })

  it('should decode a valid custom user claim', () => {
    const decodedJwt = JWT.decode(jwtToken) as Token
    expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]).toBeObject()
    // Test if the custom claims work
    expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')
  })
})

it('should delete an account', (done) => {
  registerAccount(request).then(() => {
    request
      .post('/auth/delete')
      .expect(204)
      .end(end(done))
  })
})

// test anonymous account
// const anonymousAccountIt = ANONYMOUS_USERS_ENABLE ? it : it.skip
// anonymousAccountIt('should login anonymously', (done) => {
//   const { body, status } = await request.post('/auth/login').send({ anonymous: true })
//   expect(status).toEqual(200)
//   expect(body.jwt_token).toBeString()
//   expect(body.jwt_expires_in).toBeNumber()
// })