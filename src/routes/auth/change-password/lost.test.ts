import 'jest-extended'

import { AUTHENTICATION } from '@shared/config'
import { account, request } from '@test/test-mock-account'
import { mailHogSearch, deleteMailHogEmail } from '@test/test-utils'
import { end } from '@test/supertest-shared-utils'

const describeIfSecurePasswordChange = AUTHENTICATION.LOST_PASSWORD_ENABLE ? describe : describe.skip
describeIfSecurePasswordChange('Reset lost password', () => {
  let ticket: string

  it('should request a reset ticket to be sent by email', (done) => {
    request
      .post('/auth/change-password/request')
      .send({ email: account.email })
      .expect(204)
      .end(end(done))
  })

  it('should receive a ticket by email', async () => {
    const [message] = await mailHogSearch(account.email)
    expect(message).toBeTruthy()
    expect(message.Content.Headers.Subject).toInclude('Reset your password')
    ticket = message.Content.Headers['X-Ticket'][0]
    expect(ticket).toBeString()
    await deleteMailHogEmail(message)
  })

  it('should change the password from a ticket', (done) => {
    request
      .post('/auth/change-password/change')
      .send({
        ticket,
        new_password: account.password
      })
      .expect(204)
      .end(end(done))
    // ? check if the hash has been changed in the DB?
  })
})
