import 'jest-extended'

import { request } from '@test/server'
import { end, saveJwt, saveRefreshToken, validJwt, validRefreshToken } from '@test/supertest-shared-utils'
import { registerAccount, registerAndLoginAccount } from '@test/utils'

it('should refresh the token', (done) => {
  registerAndLoginAccount(request).then(() => {
    request
      .get('/auth/token/refresh')
      .expect(200)
      .expect(validJwt())
      .end(end(done))
  })
})

it('should revoke the token', (done) => {
  registerAndLoginAccount(request).then(() => {
    request
      .post('/auth/token/revoke')
      .expect(204)
      .end(end(done))
  })
})

describe('handle refresh tokens without cookies', () => {
  it('should refresh the token', (done) => {
    let refreshToken = ''

    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(200)
        .expect(validRefreshToken())
        .expect(saveRefreshToken(r => refreshToken = r))
        .end((err) => {
          if(err) return done(err)

          request
            .get('/auth/token/refresh')
            .query({ refresh_token: refreshToken })
            .expect(200)
            .expect(validJwt())
            .expect(validRefreshToken())
            .end(end(done))
        })
    })
  })

  it('should revoke the token', (done) => {
    let jwtToken = ''

    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(200)
        .expect(validJwt())
        .expect(saveJwt(j => jwtToken = j))
        .end((err) => {
          if(err) return done(err)

          request
            .post('/auth/token/revoke')
            .set({ Authorization: `Bearer ${jwtToken}` })
            .expect(204)
            .end(end(done))
        })
    })
  })
})
