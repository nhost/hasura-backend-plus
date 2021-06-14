import 'jest-extended'

import { request } from '@test/server'

import { authenticator } from 'otplib'
import { end, saveJwt, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

import { Response } from 'superagent'
import { registerAccount, registerAndLoginAccount } from '@test/utils'

function saveTicket(saver: (t: string) => any) {
  return (res: Response) => {
    saver(res.body.ticket)
  }
}

function validTicket() {
  return (res: Response) => {
    expect(res.body.mfa).toBeTrue()
    expect(res.body.ticket).toBeString()
  }
}

function saveOtpSecret(saver: (o: string) => any) {
  return (res: Response) => {
    saver(res.body.otp_secret)
  }
}

function validOtpSecret() {
  return (res: Response) => {
    expect(res.body.image_url).toBeString()
    expect(res.body.otp_secret).toBeString()
  }
}

it('should generate a secret', (done) => {
  let jwtToken = ''

  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .send({ email, password })
      .expect(200)
      .expect(saveJwt((j) => (jwtToken = j)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/generate')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .expect(validOtpSecret())
          .end(end(done))
      })
  })
})

it('should enable mfa for account', (done) => {
  let jwtToken = ''
  let otpSecret = ''

  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .send({ email, password })
      .expect(200)
      .expect(saveJwt((j) => (jwtToken = j)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/generate')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .expect(validOtpSecret())
          .expect(saveOtpSecret((o) => (otpSecret = o)))
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/mfa/enable')
              .set({ Authorization: `Bearer ${jwtToken}` })
              .send({ code: authenticator.generate(otpSecret) })
              .expect(204)
              .end(end(done))
          })
      })
  })
})

it('should sign the account in (mfa)', (done) => {
  let otpSecret = ''
  let ticket = ''

  registerAndLoginAccount(request).then(({ email, password, jwtToken }) => {
    request
      .post('/auth/mfa/generate')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(validOtpSecret())
      .expect(saveOtpSecret((o) => (otpSecret = o)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/enable')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .send({ code: authenticator.generate(otpSecret) })
          .expect(204)
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/login')
              .send({ email, password })
              .expect(200)
              .expect(validTicket())
              .expect(saveTicket((t) => (ticket = t)))
              .end((err) => {
                if (err) return done(err)

                request
                  .post('/auth/mfa/totp')
                  .send({
                    ticket,
                    code: authenticator.generate(otpSecret)
                  })
                  .expect(200)
                  .expect(validJwt())
                  .expect(validRefreshToken())
                  .end(end(done))
              })
          })
      })
  })
})

it('should disable mfa for account', (done) => {
  let otpSecret = ''
  let ticket = ''
  let secondJwtToken = ''

  registerAndLoginAccount(request).then(({ email, password, jwtToken }) => {
    request
      .post('/auth/mfa/generate')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(validOtpSecret())
      .expect(saveOtpSecret((o) => (otpSecret = o)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/enable')
          .send({ code: authenticator.generate(otpSecret) })
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(204)
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/login')
              .send({ email, password })
              .expect(200)
              .expect(validTicket())
              .expect(saveTicket((t) => (ticket = t)))
              .end((err) => {
                if (err) return done(err)

                request
                  .post('/auth/mfa/totp')
                  .send({
                    ticket,
                    code: authenticator.generate(otpSecret)
                  })
                  .expect(200)
                  .expect(validJwt())
                  .expect(saveJwt((j) => (secondJwtToken = j)))
                  .expect(validRefreshToken())
                  .end((err) => {
                    if (err) return done(err)

                    request
                      .post('/auth/mfa/disable')
                      .set({ Authorization: `Bearer ${secondJwtToken}` })
                      .send({ code: authenticator.generate(otpSecret) })
                      .expect(204)
                      .end(end(done))
                  })
              })
          })
      })
  })
})

it('should not generate mfa qr if mfa enabled for account', (done) => {
  let otpSecret = ''

  registerAndLoginAccount(request).then(({ email, password, jwtToken }) => {
    request
      .post('/auth/mfa/generate')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(validOtpSecret())
      .expect(saveOtpSecret((o) => (otpSecret = o)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/enable')
          .send({ code: authenticator.generate(otpSecret) })
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(204)
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/login')
              .send({ email, password })
              .expect(200)
              .expect(validTicket())
              .end((err) => {
                if (err) return done(err)

                request.post('/auth/mfa/generate').expect(400)
              })
              .end(end(done))
          })
      })
  })
})
