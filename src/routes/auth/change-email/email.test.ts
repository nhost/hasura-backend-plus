import 'jest-extended'

import { mailHogSearch, deleteMailHogEmail, generateRandomEmail, withEnv } from '@test/utils'
import { registerAndLoginAccount } from '@test/utils'

import { request } from '@test/server'
import { end } from '@test/supertest-shared-utils'

it('should request to change email and receive a ticket by email', (done) => {
  withEnv({
    EMAILS_ENABLE: 'true',
    VERIFY_EMAILS: 'true'
  }, request, async () => {
    await registerAndLoginAccount(request).then(({ jwtToken }) => {
      const new_email = generateRandomEmail()

      request
        .post(`/auth/change-email/request`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .send({ new_email })
        .expect(204)
        .end(async (err) => {
          if(err) return done(err)
          const [message] = await mailHogSearch(new_email)
          expect(message).toBeTruthy()
          expect(message.Content.Headers.Subject).toInclude('Change your email address')
          expect(message.Content.Headers['X-Ticket'][0]).toBeString()
          await deleteMailHogEmail(message)
          done()
        })
    });
  })
})

it('should change the email from a ticket', (done) => {
  withEnv({
    EMAILS_ENABLE: 'true',
    VERIFY_EMAILS: 'true'
  }, request, async () => {
    await registerAndLoginAccount(request).then(({ jwtToken }) => {
      const new_email = generateRandomEmail()

      request
        .post(`/auth/change-email/request`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .send({ new_email })
        .expect(204)
        .end(async (err) => {
          if(err) return done(err)
          const [message] = await mailHogSearch(new_email)
          expect(message).toBeTruthy()
          expect(message.Content.Headers.Subject).toInclude('Change your email address')
          const ticket = message.Content.Headers['X-Ticket'][0]
          expect(ticket).toBeString()
          await deleteMailHogEmail(message)

          request
            .post(`/auth/change-email/change`)
            .set({ Authorization: `Bearer ${jwtToken}` })
            .send({ ticket })
            .expect(204)
            .end(end(done))
        })
    })
  })
})

it('should reconnect using the new email', (done) => {
  withEnv({
    EMAILS_ENABLE: 'true',
    VERIFY_EMAILS: 'true'
  }, request, async () => {
    await registerAndLoginAccount(request).then(({ email, password, jwtToken }) => {
      const new_email = generateRandomEmail()

      request
        .post(`/auth/change-email/request`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .send({ new_email })
        .expect(204)
        .end(async (err) => {
          if(err) return done(err)
          const [message] = await mailHogSearch(new_email)
          expect(message).toBeTruthy()
          expect(message.Content.Headers.Subject).toInclude('Change your email address')
          const ticket = message.Content.Headers['X-Ticket'][0]
          expect(ticket).toBeString()
          await deleteMailHogEmail(message)

          request
            .post(`/auth/change-email/change`)
            .set({ Authorization: `Bearer ${jwtToken}` })
            .send({ ticket })
            .expect(204)
            .end(async (err) => {
              if(err) return done(err)

              request
                .post('/auth/login')
                .send({ email: new_email, password })
                .expect(200)
                .end(end(done))
            })
        })
    })
  })
})
