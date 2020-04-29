import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'
import { mailHogSearch, deleteMailHogEmail } from '@test/test-utils'

let ticket: string

it('should change the password from the old password', async () => {
  const new_password = generateRandomString()
  const { status } = await request
    .post('/auth/change-password/change')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ old_password: account.password, new_password })
  account.password = new_password
  expect(status).toEqual(204)
  // ? check if the hash has been changed in the DB?
})

it('should request a reset ticket to be sent by email', async () => {
  const { status } = await request
    .post('/auth/change-password/request')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ email: account.email })
  expect(status).toBe(204)
})

it('should receive a ticket by email', async () => {
  const [message] = await mailHogSearch(account.email)
  expect(message).toBeTruthy()
  expect(message.Content.Headers.Subject).toInclude('Reset your password')
  ticket = message.Content.Headers['X-Ticket'][0]
  expect(ticket).toBeString()
  await deleteMailHogEmail(message)
})

it('should change the password from a ticket', async () => {
  const { status } = await request.post('/auth/change-password/change').send({
    ticket,
    new_password: account.password
  })
  // ? check if the hash has been changed in the DB?
  expect(status).toEqual(204)
})
