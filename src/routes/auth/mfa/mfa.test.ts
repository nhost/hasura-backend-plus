import 'jest-extended'

import { account, request } from '@test/test-mock-account'

import { authenticator } from 'otplib'
import { end, saveJwt, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

import { Response } from 'superagent'

let otpSecret: string
let accountTicket: string

function saveTicket() {
  return (res: Response) => {
    accountTicket = res.body.ticket
  }
}

function validTicket() {
  return (res: Response) => {
    expect(res.body.mfa).toBeTrue()
    expect(res.body.ticket).toBeString()
  }
}

function saveOtpSecret() {
  return (res: Response) => {
    otpSecret = res.body.otp_secret
  }
}

function validOtpSecret() {
  return (res: Response) => {
    expect(res.body.image_url).toBeString()
    expect(res.body.otp_secret).toBeString()
  }
}

it('should generate a secret', (done) => {
  request
    .post('/auth/mfa/generate')
    .expect(200)
    .expect(validOtpSecret())
    .expect(saveOtpSecret())
    .end(end(done))
})

it('should enable mfa for account', (done) => {
  request
    .post('/auth/mfa/enable')
    .send({ code: authenticator.generate(otpSecret) })
    .expect(204)
    .end(end(done))
})

it('should return a ticket', (done) => {
  request
    .post('/auth/login')
    .send({ email: account.email, password: account.password })
    .expect(200)
    .expect(validTicket())
    .expect(saveTicket())
    .end(end(done))
})

it('should sign the account in (mfa)', (done) => {
  request
    .post('/auth/mfa/totp').send({
      ticket: accountTicket,
      code: authenticator.generate(otpSecret)
    })
    .expect(200)
    .expect(saveJwt((j) => account.token = j))
    .expect(validJwt())
    .end(end(done))
})

it('should disable mfa for account', (done) => {
  request
    .post('/auth/mfa/disable')
    .send({ code: authenticator.generate(otpSecret) })
    .expect(204)
    .end(end(done))
})

describe('MFA without cookies', () => {
  let jwtToken: string

  // to make sure no cookies are set
  it('Should logout user', (done) => {
    request
      .post('/auth/logout')
      .expect(204)
      .end(end(done))
  })

  it('Should login without cookies', (done) => {
    request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: false })
      .expect(200)
      .expect(saveJwt((j) => jwtToken = j))
      .end(end(done))
  })

  it('should generate a secret', (done) => {
    request
      .post('/auth/mfa/generate')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(validOtpSecret())
      .expect(saveOtpSecret())
      .end(end(done))
  })

  it('should enable mfa for account', (done) => {
    request
      .post('/auth/mfa/enable')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ code: authenticator.generate(otpSecret) })
      .expect(204)
      .end(end(done))
  })

  it('should return a ticket', (done) => {
    request
      .post('/auth/login')
      .send({ email: account.email, password: account.password })
      .expect(200)
      .expect(validTicket())
      .expect(saveTicket())
      .end(end(done))
  })

  it('should sign the account in (mfa)', (done) => {
    request
      .post('/auth/mfa/totp').send({
        ticket: accountTicket,
        code: authenticator.generate(otpSecret),
        cookie: false
      })
      .expect(200)
      .expect(validJwt())
      .expect(validRefreshToken())
      .expect(saveJwt((j) => jwtToken = j))
      .end(end(done))
  })

  it('should disable mfa for account', (done) => {
    request
      .post('/auth/mfa/disable')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ code: authenticator.generate(otpSecret) })
      .expect(204)
      .end(end(done))
  })
})
