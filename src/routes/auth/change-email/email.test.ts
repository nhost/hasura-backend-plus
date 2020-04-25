import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@shared/test-mock-account'

import { mailHogSearch, deleteMailHogEmail } from '@shared/test-utils'

let ticket: string
const new_email = `${generateRandomString()}@${generateRandomString()}.com`

it('should request to change email', async () => {
  const { status } = await request
    .post('/auth/change-email/request')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ email: account.email, new_email })
  expect(status).toBe(204)
})

it('should receive a ticket by email', async () => {
  const [message] = await mailHogSearch(account.email)
  expect(message).toBeTruthy()
  expect(message.Content.Headers.Subject).toInclude('Change your email address')
  ticket = message.Content.Headers['X-Ticket'][0]
  expect(ticket).toBeString()
  await deleteMailHogEmail(message)
})

it('should change the email from a ticket', async () => {
  const { status } = await request.post('/auth/change-email/change').send({ ticket })
  expect(status).toEqual(204)
  // ? check if the email has been changed in the DB?
})
