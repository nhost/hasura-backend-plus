import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'

import { mailHogSearch, deleteMailHogEmail } from '@test/test-utils'
import { JWT } from 'jose'
import { Token } from '@shared/types'
import { JWT_CLAIMS_NAMESPACE, NOTIFY_EMAIL_CHANGE, EMAILS_ENABLE } from '@shared/config'

let ticket: string
const new_email = `${generateRandomString()}@${generateRandomString()}.com`

it('should request to change email', async () => {
  const { status } = await request.post('/auth/change-email/request').send({ new_email })
  expect(status).toBe(204)
})

it('should receive a ticket by email', async () => {
  const [message] = await mailHogSearch(new_email)
  expect(message).toBeTruthy()
  expect(message.Content.Headers.Subject).toInclude('Change your email address')
  ticket = message.Content.Headers['X-Ticket'][0]
  expect(ticket).toBeString()
  await deleteMailHogEmail(message)
})

it('should change the email from a ticket', async () => {
  const { status } = await request.post('/auth/change-email/change').send({ ticket })
  expect(status).toEqual(204)
})

it('should reconnect using the new email', async () => {
  const {
    body: { jwt_token, jwt_expires_in },
    status
  } = await request.post('/auth/login').send({ email: new_email, password: account.password })
  expect(status).toEqual(200)
  expect(jwt_token).toBeString()
  expect(jwt_expires_in).toBeNumber()
  const decodedJwt = JWT.decode(jwt_token) as Token
  expect(decodedJwt[JWT_CLAIMS_NAMESPACE]).toBeObject()
  expect(status).toEqual(200)
  account.token = jwt_token
})

it('should receive an email notifying the email account has been changed', async () => {
  if (EMAILS_ENABLE && NOTIFY_EMAIL_CHANGE) {
    const [message] = await mailHogSearch(account.email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude(
      'The email attached to your account has been changed'
    )
    await deleteMailHogEmail(message)
  }
})
