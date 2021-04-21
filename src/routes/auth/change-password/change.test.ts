import 'jest-extended'

import { generateRandomString } from '@shared/helpers'
import { account, request } from '@test/test-mock-account'
import { end, saveJwt } from '@test/supertest-shared-utils'

it('should change the password from the old password', (done) => {
  const new_password = generateRandomString()
  request
    .post('/auth/change-password')
    .send({ old_password: account.password, new_password })
    .expect(204)
    .expect(() => {
      account.password = new_password
    })
    .end(end(done))
  // ? check if the hash has been changed in the DB?
})

describe('change password without cookies', () => {
  let jwtToken: string

  // to make sure no cookies are set
  it('Should logout user', (done) => {
    request
      .post('/auth/logout')
      .expect(204)
      .end(end(done))
  })

  it('Should login user', (done) => {
    request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: false })
      .expect(200)
      .expect(saveJwt(j => jwtToken = j))
      .end(end(done))
  })

  it('should change password using old password', (done) => {
    const new_password = generateRandomString()
    request
      .post('/auth/change-password')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ old_password: account.password, new_password })
      .expect(204)
      .expect(() => {
        account.password = new_password
      })
      .end(end(done))
  })
})
