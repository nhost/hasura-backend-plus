import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'

import { mailHogSearch, deleteMailHogEmail } from '@test/test-utils'
import { JWT } from 'jose'
import { Token } from '@shared/types'
import { AUTHENTICATION, APPLICATION, JWT as CONFIG_JWT } from '@shared/config'
import { end, saveJwt, validJwt } from '@test/supertest-shared-utils'

let ticket: string
const new_email = `${generateRandomString()}@${generateRandomString()}.com`

it('should request to change email', (done) => {
  request
    .post('/auth/change-email/request')
    .send({ new_email })
    .expect(204)
    .end(end(done))
})

it('should receive a ticket by email', async () => {
  const [message] = await mailHogSearch(new_email)
  expect(message).toBeTruthy()
  expect(message.Content.Headers.Subject).toInclude('Change your email address')
  ticket = message.Content.Headers['X-Ticket'][0]
  expect(ticket).toBeString()
  await deleteMailHogEmail(message)
})

it('should change the email from a ticket', (done) => {
  request
    .post('/auth/change-email/change')
    .send({ ticket })
    .expect(204)
    .end(end(done))
})

it('should reconnect using the new email', (done) => {
  request
    .post('/auth/login')
    .send({ email: new_email, password: account.password })
    .expect(200)
    .expect(validJwt())
    .expect((res) => {
      const decodedJwt = JWT.decode(res.body.jwt_token) as Token
      expect(decodedJwt[CONFIG_JWT.CLAIMS_NAMESPACE]).toBeObject()
    })
    .expect(saveJwt(j => account.token = j))
    .end(end(done))
})

it('should receive an email notifying the email account has been changed', async () => {
  if (APPLICATION.EMAILS_ENABLE && AUTHENTICATION.NOTIFY_EMAIL_CHANGE) {
    const [message] = await mailHogSearch(account.email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude(
      'The email attached to your account has been changed'
    )
    await deleteMailHogEmail(message)
  }
})
