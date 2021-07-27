import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'

import { APPLICATION, JWT as CONFIG_JWT, REGISTRATION, HEADERS } from '@shared/config'
import {
  generateRandomEmail,
  generateRandomString,
  deleteMailHogEmail,
  mailHogSearch,
  registerAccount,
  registerAndLoginAccount,
  getHeaderFromLatestEmailAndDelete
} from '@test/utils'

import { JWT } from 'jose'
import { Token } from '@shared/types'
import { end, saveJwt, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

import { Response } from 'superagent'

import { withEnv } from '../../test/utils'

import { request } from '../../test/server'

function errorMessageEqual(msg: string) {
  return (res: Response) => {
    expect(res.body.message).toEqual(msg)
  }
}

const pwndPasswordIt = REGISTRATION.HIBP_ENABLED ? it : it.skip
pwndPasswordIt('should tell the password has been pwned 123', (done) => {
  withEnv(
    {
      HIBP_ENABLED: 'true'
    },
    request,
    async () => {
      request
        .post('/auth/register')
        .send({ email: generateRandomEmail(), password: '123456' })
        .expect(400)
        .expect(errorMessageEqual('Password is too weak.'))
        .end(end(done))
    },
    {
      HIBP_ENABLED: 'false'
    }
  )
})

it('should create an account', (done) => {
  withEnv(
    {
      REGISTRATION_CUSTOM_FIELDS: ''
    },
    request,
    async () => {
      request
        .post('/auth/register')
        .send({
          email: generateRandomEmail(),
          password: generateRandomString()
        })
        .expect(200)
        .end(end(done))
    }
  )
})

it('should create an account with custom user data', (done) => {
  withEnv(
    {
      REGISTRATION_CUSTOM_FIELDS: 'name'
    },
    request,
    async () => {
      request
        .post('/auth/register')
        .send({
          email: generateRandomEmail(),
          password: generateRandomString(),
          user_data: { name: 'Test name' }
        })
        .expect(200)
        .end(end(done))
    }
  )
})

it('should create an account without a password when magic link login is enabled', async () => {
  await withEnv(
    {
      MAGIC_LINK_ENABLED: 'true',
      AUTO_ACTIVATE_NEW_USERS: 'false',
      REGISTRATION_CUSTOM_FIELDS: 'name'
    },
    request,
    async () => {
      const email = generateRandomEmail()

      const { body, status } = await request
        .post('/auth/register')
        .send({ email, user_data: { name: 'Test name' } })

      expect(status).toEqual(200)
      expect(body.jwt_token).toBeNull()
      expect(body.jwt_expires_in).toBeNull()
      expect(body.user).toBeTruthy()

      const [message] = await mailHogSearch(email)
      expect(message).toBeTruthy()
      const token = message.Content.Headers['X-Token'][0]
      await deleteMailHogEmail(message)

      {
        const { status } = await request.get(`/auth/magic-link?action=register&token=${token}`)
        expect(status).toBe(302)
      }
    }
  )
})

it('should not create an account without a password when magic link login is disabled', (done) => {
  withEnv(
    {
      MAGIC_LINK_ENABLED: 'false'
    },
    request,
    async () => {
      request
        .post('/auth/register')
        .send({ email: generateRandomEmail(), user_data: { name: 'Test name' } })
        .expect(400)
        .end(end(done))
    }
  )
})

it('should fail to create account with unallowed role', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
      user_data: { name: 'Test name' },
      register_options: {
        allowed_roles: ['user', 'me', 'super-admin']
      }
    })
    .expect(400)
    .end(end(done))
})

it('should fail to create account with default_role that does not overlap allowed_roles', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
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
  withEnv(
    {
      DEFAULT_ALLOWED_USER_ROLES: 'user,me,editor',
      ALLOWED_USER_ROLES: 'user,me,editor'
    },
    request,
    async () => {
      request
        .post('/auth/register')
        .send({
          email: generateRandomEmail(),
          password: generateRandomString(),
          register_options: {
            default_role: 'editor'
          }
        })
        .expect(200)
        .end(end(done))
    }
  )
})

it('should register account with default_role and allowed_roles set', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
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
  const email = generateRandomEmail()
  const password = generateRandomString()

  request
    .post('/auth/register')
    .send({ email, password })
    .end((err) => {
      if (err) return done(err)
      request
        .post('/auth/register')
        .send({ email, password })
        .expect(400)
        .expect(errorMessageEqual('Account already exists but is not activated.'))
        .end(end(done))
    })
})

it('should fail to activate an user from a wrong ticket', async () => {
  await withEnv(
    {
      AUTO_ACTIVATE_NEW_USERS: 'false',
      EMAILS_ENABLED: 'true'
    },
    request,
    async () => {
      const { status, redirect, header } = await request.get(`/auth/activate?ticket=${uuidv4()}`)
      expect(
        status === 500 ||
          (status === 302 && redirect && header?.location === APPLICATION.REDIRECT_URL_ERROR)
      ).toBeTrue()
    }
  )
})

it('should activate the account from a valid ticket', async () => {
  await withEnv(
    {
      AUTO_ACTIVATE_NEW_USERS: 'false',
      EMAILS_ENABLED: 'true'
    },
    request,
    async () => {
      const email = generateRandomEmail()
      const password = generateRandomString()

      await request.post('/auth/register').send({ email, password })

      const ticket = await getHeaderFromLatestEmailAndDelete(email, 'X-Ticket')

      await request.get(`/auth/activate?ticket=${ticket}`).expect(302)
    }
  )
})

it('should not sign user with wrong password', (done) => {
  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .send({ email, password: password + '1' })
      .expect(401)
      .end(end(done))
  })
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
  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .send({ email, password })
      .expect(validJwt())
      .expect(200)
      .end(end(done))
  })
})

it('should sign the user in without password when magic link is enabled', async () => {
  await withEnv(
    {
      MAGIC_LINK_ENABLED: 'true',
      AUTO_ACTIVATE_NEW_USERS: 'false',
      VERIFY_EMAILS: 'true'
    },
    request,
    async () => {
      const email = generateRandomEmail()

      const { body, status } = await request
        .post('/auth/register')
        .send({ email, user_data: { name: 'Test name' } })

      expect(status).toEqual(200)
      expect(body.jwt_token).toBeNull()
      expect(body.jwt_expires_in).toBeNull()
      expect(body.user).toBeTruthy()

      const token = await getHeaderFromLatestEmailAndDelete(email, 'X-Token')

      {
        const { status } = await request.get(`/auth/magic-link?action=register&token=${token}`)
        expect(status).toBe(302)
      }

      {
        const { body, status } = await request.post('/auth/login').send({ email })
        expect(status).toEqual(200)
        expect(body.magicLink).toBeTrue()

        const token = await getHeaderFromLatestEmailAndDelete(email, 'X-Token')

        {
          const { status } = await request.get(`/auth/magic-link?action=log-in&token=${token}`)
          expect(status).toBe(302)
        }
      }
    }
  )
})

it('should not sign the user in without password when magic link is disabled', (done) => {
  withEnv(
    {
      MAGIC_LINK_ENABLED: 'false'
    },
    request,
    async () => {
      request.post('/auth/login').send({ email: generateRandomEmail() }).expect(400).end(end(done))
    }
  )
})

it('should not sign user in with invalid admin secret', (done) => {
  registerAccount(request).then(({ email }) => {
    request
      .post('/auth/login')
      .set(HEADERS.ADMIN_SECRET_HEADER, 'invalidsecret')
      .send({ email, password: 'invalidpassword' })
      .expect(401)
      .end(end(done))
  })
})

it('should sign in user with valid admin secret', (done) => {
  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .set(HEADERS.ADMIN_SECRET_HEADER, APPLICATION.HASURA_GRAPHQL_ADMIN_SECRET as string)
      .send({ email, password })
      .expect(200)
      .expect(validJwt())
      .end(end(done))
  })
})

it('should decode a valid custom user claim', (done) => {
  let jwtToken = ''

  withEnv(
    {
      REGISTRATION_CUSTOM_FIELDS: 'name',
      JWT_CUSTOM_FIELDS: 'name'
    },
    request,
    async () => {
      registerAccount(request, { name: 'Test name' }).then(({ email, password }) => {
        request
          .post('/auth/login')
          .send({ email, password })
          .expect(200)
          .expect(saveJwt((j) => (jwtToken = j)))
          .end((err) => {
            if (err) return done(err)

            const decodedJwt = JWT.decode(jwtToken) as Token
            expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]).toBeObject()
            // Test if the custom claims work

            expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')
            done()
          })
      })
    }
  )
})

it('should logout', (done) => {
  registerAndLoginAccount(request).then(() => {
    request.post('/auth/logout').send().expect(204).end(end(done))
  })
})

describe('Tests without cookies', () => {
  it('Should login without cookies', (done) => {
    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(validJwt())
        .expect(validRefreshToken())
        .end(end(done))
    })
  })

  it('should decode a valid custom user claim', (done) => {
    let jwtToken = ''

    registerAccount(request, { name: 'Test name' }).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(validJwt())
        .expect(validRefreshToken())
        .expect(saveJwt((j) => (jwtToken = j)))
        .end((err) => {
          if (err) return done(err)

          const decodedJwt = JWT.decode(jwtToken) as Token
          expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]).toBeObject()
          // Test if the custom claims work
          expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]['x-hasura-name']).toEqual('Test name')

          done()
        })
    })
  })
})

it('should delete an account', (done) => {
  withEnv(
    {
      ALLOW_USER_SELF_DELETE: 'true'
    },
    request,
    async () => {
      registerAndLoginAccount(request).then(() => {
        request.post('/auth/delete').expect(204).end(end(done))
      })
    }
  )
})
