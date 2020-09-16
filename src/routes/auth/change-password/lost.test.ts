import 'jest-extended'

import { LOST_PASSWORD_ENABLE } from '@shared/config'
import { account, request } from '@test/test-mock-account'
import { mailHogSearch, deleteMailHogEmail } from '@test/test-utils'

const describeIfSecurePasswordChange = LOST_PASSWORD_ENABLE ? describe : describe.skip
describeIfSecurePasswordChange('Reset lost password', () => {
  let ticket: string

  it('should request a reset ticket to be sent by email', async () => {
    const { status } = await request
      .post('/auth/change-password/request')
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
})
