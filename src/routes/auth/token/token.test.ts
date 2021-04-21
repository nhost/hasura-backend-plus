import 'jest-extended'

import { account, request } from '@test/test-mock-account'
import { end, saveJwt, saveRefreshToken, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

it('should refresh the token', (done) => {
  request
    .get('/auth/token/refresh')
    .expect(200)
    .expect(validJwt())
    .end(end(done))
})

it('should revoke the token', (done) => {
  request
    .post('/auth/token/revoke')
    .expect(204)
    .end(end(done))
})

describe('handle refresh tokens without cookies', () => {
  let jwtToken: string
  let refreshToken: string

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
      .expect(saveRefreshToken(r => refreshToken = r))
      .expect(saveJwt(j => jwtToken = j))
      .end(end(done))
  })

  it('should refresh the token', (done) => {
    request
      .get('/auth/token/refresh')
      .query({ refresh_token: refreshToken })
      .expect(200)
      .expect(validJwt())
      .expect(validRefreshToken())
      .end(end(done))
  })

  it('should revoke the token', (done) => {
    request
      .post('/auth/token/revoke')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(204)
      .end(end(done))
  })
})
