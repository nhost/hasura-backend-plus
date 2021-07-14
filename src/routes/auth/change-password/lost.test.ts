import 'jest-extended'

import { request } from '@test/server'
import {
  mailHogSearch,
  deleteMailHogEmail,
  withEnv,
  registerAccount,
  generateRandomString
} from '@test/utils'
import { end } from '@test/supertest-shared-utils'

describe('Reset lost password', () => {
  beforeAll(async () => {
    withEnv(
      {
        LOST_PASSWORD_ENABLED: 'true'
      },
      request
    )
  })

  let ticket: string

  it('should request a reset ticket to be sent by email', (done) => {
    registerAccount(request).then(({ email }) => {
      request
        .post('/auth/change-password/request')
        .send({ email: email })
        .expect(204)
        .end(end(done))
    })
  })

  it('should receive a ticket by email', (done) => {
    registerAccount(request).then(({ email }) => {
      request
        .post('/auth/change-password/request')
        .send({ email: email })
        .expect(204)
        .end(async (err) => {
          if (err) return done(err)

          const [message] = await mailHogSearch(email)
          expect(message).toBeTruthy()
          expect(message.Content.Headers.Subject).toInclude('Reset your password')
          ticket = message.Content.Headers['X-Ticket'][0]
          expect(ticket).toBeString()
          await deleteMailHogEmail(message)

          done()
        })
    })
  })

  it('should change the password from a ticket', (done) => {
    registerAccount(request).then(({ email }) => {
      request
        .post('/auth/change-password/request')
        .send({ email: email })
        .expect(204)
        .end(async (err) => {
          if (err) return done(err)

          const [message] = await mailHogSearch(email)
          expect(message).toBeTruthy()
          expect(message.Content.Headers.Subject).toInclude('Reset your password')
          ticket = message.Content.Headers['X-Ticket'][0]
          expect(ticket).toBeString()
          await deleteMailHogEmail(message)

          request
            .post('/auth/change-password/change')
            .send({
              ticket,
              new_password: generateRandomString()
            })
            .expect(204)
            .end(end(done))
        })
    })
    // ? check if the hash has been changed in the DB?
  })
})
