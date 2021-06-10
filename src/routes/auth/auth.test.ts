import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'

import { APPLICATION, JWT as CONFIG_JWT, HEADERS } from '@shared/config'
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
import { end, saveJwt, validJwt } from '@test/supertest-shared-utils'

import { Response } from 'superagent'

import { withEnv } from '../../test/utils'

import { request } from '../../test/server'

function errorMessageEqual(msg: string) {
  return (res: Response) => {
    expect(res.body.message).toEqual(msg)
  }
}

// function isAnonymous() {
//   return (res: Response) => {
//     expect(res.body.user.name).toBeNull()
//   }
// }

it('should tell the password has been pwned', (done) => {
  withEnv({
    HIBP_ENABLED: 'true'
  }, request, async () => {
    request
      .post('/auth/register')
      .send({ email: generateRandomEmail(), password: '123456' })
      .expect(400)
      .expect(errorMessageEqual('Password is too weak.'))
      .end(end(done))
  })
})

it('should create an account', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
      // user_data: { name: 'Test name' }
    })
    .expect(200)
    .end(end(done))
})

it('should create an account without a password when magic link login is enabled', async () => {
  await withEnv(
    {
      MAGIC_LINK_ENABLED: 'true'
    },
    request,
    async () => {
      const email = generateRandomEmail()

      const { body, status } = await request
        .post('/auth/register')
        .send({ email })
        // .send({ email, user_data: { name: 'Test name' } })

      expect(status).toEqual(200)
      expect(body.jwt_token).toBeNull()
      expect(body.jwt_expires_in).toBeNull()
      expect(body.user).toBeTruthy()

      const [message] = await mailHogSearch(email)
      expect(message).toBeTruthy()
      const token = message.Content.Headers['X-Token'][0]
      await deleteMailHogEmail(message)

      {
        const { status } = await request.get(`/auth/magic-link?action=sign-up&token=${token}`)
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
        .send({ email: generateRandomEmail() })
        // .send({ email: generateRandomEmail(), user_data: { name: 'Test name' } })
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
      // user_data: { name: 'Test name' },
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
      // user_data: { name: 'Test name' },
      register_options: {
        default_role: 'editor',
        allowed_roles: ['user', 'me']
      }
    })
    .expect(400)
    .end(end(done))
})

it('should create account with default_role that is in the ALLOWED_USER_ROLES variable', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
      // user_data: { name: 'Test name' },
      register_options: {
        default_role: 'editor'
      }
    })
    .expect(200)
    .end(end(done))
})

it('should register account with default_role and allowed_roles set', (done) => {
  request
    .post('/auth/register')
    .send({
      email: generateRandomEmail(),
      password: generateRandomString(),
      // user_data: { name: 'Test name' },
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
        .expect(errorMessageEqual('Account already exists.'))
        .end(end(done))
    })
})

it('should fail to activate an user from a wrong ticket', (done) => {
  withEnv(
    {
      AUTO_ACTIVATE_NEW_USERS: 'false',
      EMAILS_ENABLED: 'true',
      REDIRECT_URL_ERROR: ''
    },
    request,
    async () => {
      request
        .get(`/auth/activate?ticket=${uuidv4()}`)
        .expect(401)
        .end(end(done))
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

      const { status } = await request.get(`/auth/activate?ticket=${ticket}`)
      expect(status).toBeOneOf([204, 302])
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
        .send({ email })
        // .send({ email, user_data: { name: 'Test name' } })

      expect(status).toEqual(200)
      expect(body.jwt_token).toBeNull()
      expect(body.jwt_expires_in).toBeNull()
      expect(body.user).toBeTruthy()

      const token = await getHeaderFromLatestEmailAndDelete(email, 'X-Token')

      {
        const { status } = await request.get(`/auth/magic-link?action=sign-up&token=${token}`)
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
})

it('should logout', (done) => {
  registerAndLoginAccount(request).then(({ refresh_token }) => {
    request
      .post(`/auth/logout`)
      .query({ refresh_token })
      .send()
      .expect(204)
      .end(end(done))
  });
})

it('should delete an account', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/auth/delete`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(204)
      .end(end(done))
  })
})

it('should log in anonymously', (done) => {
  const anonymousRole = 'anonymous'

  withEnv({
    ANONYMOUS_USERS_ENABLED: 'true',
    DEFAULT_ANONYMOUS_ROLE: anonymousRole,
    ALLOWED_USER_ROLES: ['user', 'me', 'editor', anonymousRole].join(',')
  }, request, async () => {
    request
      .post('/auth/login')
      .send({
        anonymous: true
      })
      .expect(200)
      .expect(validJwt())
      // .expect((isAnonymous()))
      .end(end(done))
  })
})

it('should be able to deanonymize anonymous user', (done) => {
  const anonymousRole = 'anonymous'
  let jwtToken = ''

  withEnv({
    ANONYMOUS_USERS_ENABLED: 'true',
    DEFAULT_ANONYMOUS_ROLE: anonymousRole,
    ALLOWED_USER_ROLES: ['user', 'me', 'editor', anonymousRole].join(','),
    AUTO_ACTIVATE_NEW_USERS: 'true'
  }, request, async () => {
    request
      .post('/auth/login')
      .send({
        anonymous: true
      })
      .expect(200)
      .expect(validJwt())
      .expect(saveJwt(j => jwtToken = j))
      // .expect(isAnonymous())
      .end((err) => {
        if(err) return done(err)

        const email = generateRandomEmail()
        const password = generateRandomString()

        request
          .post('/auth/deanonymize')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .send({
            email,
            password
          })
          .expect(204)
          .end((err) => {
            if(err) return done(err)

            request
              .post('/auth/login')
              .send({ email, password })
              .expect(200)
              .expect(validJwt())
              .end(end(done))
          })
      })
  })
})

it('should be able to deanonymize anonymous user without auto activation', (done) => {
  const anonymousRole = 'anonymous'
  let jwtToken = ''

  withEnv({
    ANONYMOUS_USERS_ENABLED: 'true',
    DEFAULT_ANONYMOUS_ROLE: anonymousRole,
    ALLOWED_USER_ROLES: ['user', 'me', 'editor', anonymousRole].join(','),
    AUTO_ACTIVATE_NEW_USERS: 'false',
    REDIRECT_URL_SUCCESS: '',
    REDIRECT_URL_ERROR: ''
  }, request, async () => {
    request
      .post('/auth/login')
      .send({
        anonymous: true
      })
      .expect(200)
      .expect(validJwt())
      .expect(saveJwt(j => jwtToken = j))
      // .expect((isAnonymous()))
      .end((err) => {
        if(err) return done(err)

        const email = generateRandomEmail()
        const password = generateRandomString()

        request
          .post('/auth/deanonymize')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .send({
            email,
            password
          })
          .expect(204)
          .end(async (err) => {
            if(err) return done(err)

            const ticket = await getHeaderFromLatestEmailAndDelete(email, 'X-Ticket')

            request
              .get(`/auth/activate?ticket=${ticket}`)
              .expect(200)
              .end((err) => {
                if(err) return done(err)

                request
                  .post('/auth/login')
                  .send({ email, password })
                  .expect(200)
                  .expect(validJwt())
                  .end(end(done))
              })
          })
      })
  })
})

it('should not be able to deanonymize normal account', (done) => {
  const anonymousRole = 'anonymous'
  let jwtToken = ''

  withEnv({
    ANONYMOUS_USERS_ENABLED: 'true',
    DEFAULT_ANONYMOUS_ROLE: anonymousRole,
    ALLOWED_USER_ROLES: ['user', 'me', 'editor', anonymousRole].join(',')
  }, request, async () => {
    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password })
        .expect(validJwt())
        .expect(saveJwt(j => jwtToken = j))
        .expect(200)
        .end((err) => {
          if(err) return done(err)

          request
            .post('/auth/deanonymize')
            .set({ Authorization: `Bearer ${jwtToken}` })
            .send({
              email: generateRandomEmail(),
              password: generateRandomString()
            })
            .expect(401)
            .end(end(done))
        })
    })
  })
})

it('should log in normally when anonymous login is enabled', (done) => {
  const anonymousRole = 'anonymous'

  withEnv({
    ANONYMOUS_USERS_ENABLED: 'true',
    DEFAULT_ANONYMOUS_ROLE: anonymousRole,
    ALLOWED_USER_ROLES: ['user', 'me', 'editor', anonymousRole].join(',')
  }, request, async () => {
    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password })
        .expect(validJwt())
        .expect(200)
        .end(end(done))
    })
  })
})

it('should not be able to log in anonymously when anonymous login is disabled', (done) => {
  withEnv({
    ANONYMOUS_USERS_ENABLED: 'false',
  }, request, async () => {
    request
      .post('/auth/login')
      .send({
        anonymous: true
      })
      .expect(400)
      .end(end(done))
  })
})

it('should not be able to register with admin only registration', (done) => {
  withEnv({
    ADMIN_ONLY_REGISTRATION: 'true'
  }, request, async () => {
    request
      .post('/auth/register')
      .send({
        email: generateRandomEmail(),
        password: generateRandomString()
      })
      .expect(401)
      .end(end(done))
  }, {
    ADMIN_ONLY_REGISTRATION: 'false'
  })
})

it('should not be able to register with admin only registration with incorrect x-admin-secret', (done) => {
  withEnv({
    ADMIN_ONLY_REGISTRATION: 'true'
  }, request, async () => {
    request
      .post('/auth/register')
      .send({
        email: generateRandomEmail(),
        password: generateRandomString()
      })
      .set({ 'x-admin-secret': generateRandomString() })
      .expect(401)
      .end(end(done))
  }, {
    ADMIN_ONLY_REGISTRATION: 'false'
  })
})

it('should be able to register with admin only registration with correct x-admin-secret', (done) => {
  withEnv({
    ADMIN_ONLY_REGISTRATION: 'true'
  }, request, async () => {
    request
      .post('/auth/register')
      .send({
        email: generateRandomEmail(),
        password: generateRandomString()
      })
      .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })
      .expect(200)
      .end(end(done))
  }, {
    ADMIN_ONLY_REGISTRATION: 'false'
  })
})

it('should resend the confirmation email after the timeout', (done) => {
  withEnv({
    CONFIRMATION_RESET_TIMEOUT: '0',
    AUTO_ACTIVATE_NEW_USERS: 'false',
    EMAILS_ENABLED: 'true'
  }, request, async () => {
    const email = generateRandomEmail()
    const password = generateRandomString()

    request
      .post('/auth/register')
      .send({
        email,
        password
      })
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post('/auth/resend-confirmation')
          .send({
            email
          })
          .expect(200)
          .expect(() => {
            return expect(getHeaderFromLatestEmailAndDelete(email, 'X-Ticket')).resolves.toBeTruthy()
          })
          .end(end(done))
      })
  })
})

it('should not resend the confirmation email on an activated account', (done) => {
  withEnv({
    CONFIRMATION_RESET_TIMEOUT: '0',
    AUTO_ACTIVATE_NEW_USERS: 'false',
    EMAILS_ENABLED: 'true'
  }, request, async () => {
    registerAccount(request).then(({ email }) => {
      request
        .post('/auth/resend-confirmation')
        .send({
          email
        })
        .expect(400)
        .end(end(done))
    })
  })
})

it('should not resend the confirmation email on a non-existant account', (done) => {
  withEnv({
    CONFIRMATION_RESET_TIMEOUT: '0',
    AUTO_ACTIVATE_NEW_USERS: 'false',
    EMAILS_ENABLED: 'true'
  }, request, async () => {
    request
      .post('/auth/resend-confirmation')
      .send({
        email: generateRandomEmail()
      })
      .expect(400)
      .end(end(done))
  })
})

it('should not resend the confirmation email before the timeout', (done) => {
  withEnv({
    CONFIRMATION_RESET_TIMEOUT: '5000',
    AUTO_ACTIVATE_NEW_USERS: 'false',
    EMAILS_ENABLED: 'true'
  }, request, async () => {
    const email = generateRandomEmail()
    const password = generateRandomString()

    request
      .post('/auth/register')
      .send({
        email,
        password
      })
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post('/auth/resend-confirmation')
          .send({
            email
          })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should be able to change account locale', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post('/auth/change-locale')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({
        locale: 'gr'
      })
      .expect(204)
      .end(end(done))
  })
})
