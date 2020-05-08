import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'

it('should change the password from the old password', async () => {
  const new_password = generateRandomString()
  const { status } = await request
    .post('/auth/change-password')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ old_password: account.password, new_password })
  account.password = new_password
  expect(status).toEqual(204)
  // ? check if the hash has been changed in the DB?
})
