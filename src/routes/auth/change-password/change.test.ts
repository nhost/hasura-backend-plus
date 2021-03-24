import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'

it('should change the password from the old password', async () => {
  const new_password = generateRandomString()
  const { status } = await request
    .post('/auth/change-password')
    .send({ old_password: account.password, new_password })
  account.password = new_password
  expect(status).toEqual(204)
  // ? check if the hash has been changed in the DB?
})

describe('change password without cookies', () => {
  let jwtToken: string

  // to make sure no cookies are set
  it('Should logout user', async () => {
    const { status } = await request.post('/auth/logout')
    expect(status).toEqual(204)
  })

  it('Should login user', async () => {
    const { body, status } = await request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: false })
    // Save JWT token to globally scoped varaible.
    jwtToken = body.jwt_token

    expect(status).toEqual(200)
  })

  it('should change password using old password', async () => {
    const new_password = generateRandomString()
    const { status } = await request
      .post('/auth/change-password')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ old_password: account.password, new_password })
    account.password = new_password
    expect(status).toEqual(204)
  })
})
