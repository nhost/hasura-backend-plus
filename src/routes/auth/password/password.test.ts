import 'jest-extended'

import { HasuraAccountData, generateRandomString } from '@shared/helpers'
import { account, request } from '@shared/test-utils'

import { request as admin } from '@shared/request'
import { selectAccountByEmail } from '@shared/queries'

it('should change the password from the old password', async () => {
  const new_password = generateRandomString()
  const { status } = await request
    .post('/auth/password/reset')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ old_password: account.password, new_password })
  account.password = new_password
  expect(status).toEqual(204)
  // ? check if the hash has been changed in the DB?
  // expect(body.jwt_token).toBeString()
  // expect(body.jwt_expires_in).toBeNumber()
})

it('should change the password from a ticket', async () => {
  const hasuraData = (await admin(selectAccountByEmail, {
    email: account.email
  })) as HasuraAccountData
  const ticket = hasuraData.auth_accounts[0].ticket

  const { status } = await request.post('/auth/password/reset').send({
    ticket,
    new_password: account.password
  })
  // ? check if the hash has been changed in the DB?
  expect(status).toEqual(204)
})

// TODO check if the email has been sent
