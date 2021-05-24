import 'jest-extended'

import { request } from '@test/server'

import { authenticator } from 'otplib'
import { end, saveJwt, validJwt, validRefreshToken } from '@test/supertest-shared-utils'

import { Response } from 'superagent'
import { registerAccount, registerAndLoginAccount } from '@test/utils'
import { selectAccountByEmail } from '@shared/helpers'

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

it('should generate a sms otp secret', (done) => {
  registerAndLoginAccount(request).then(({ email }) => {
    request
      .post('/auth/mfa/sms/generate')
      .expect(204)
      .expect(async () => {
        const { sms_otp_secret } = await selectAccountByEmail(email)
        expect(sms_otp_secret).toBeString()
      })
      .end(end(done))
  })
})

it('should enable sms mfa for account', (done) => {
  let smsOtpSecret = ''

  registerAndLoginAccount(request).then(({ email }) => {
    request
      .post('/auth/mfa/sms/generate')
      .expect(204)
      .expect(async () => {
        const { sms_otp_secret } = await selectAccountByEmail(email)
        if (!sms_otp_secret) return done('No SMS OPT Secret found')
        smsOtpSecret = sms_otp_secret
      })
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/sms/enable')
          .send({ code: authenticator.generate(smsOtpSecret) })
          .expect(204)
          .end(end(done))
      })
  })
})

it('should return a ticket', (done) => {
  let smsOtpSecret = ''

  registerAndLoginAccount(request).then(({ email, password }) => {
    request
      .post('/auth/mfa/sms/generate')
      .expect(204)
      .expect(async () => {
        const { sms_otp_secret } = await selectAccountByEmail(email)
        if (!sms_otp_secret) return done('No SMS OPT Secret found')
        smsOtpSecret = sms_otp_secret
      })
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/sms/enable')
          .send({ code: authenticator.generate(smsOtpSecret) })
          .expect(204)
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/login')
              .send({ email, password })
              .expect(200)
              .expect(validTicket())
              .end(end(done))
          })
      })
  })
})

it('should sign the account in (sms mfa)', (done) => {
  let ticket = ''
  let smsOtpSecret = ''

  registerAndLoginAccount(request).then(({ email, password }) => {
    request
      .post('/auth/mfa/sms/generate')
      .expect(204)
      .expect(async () => {
        const { sms_otp_secret } = await selectAccountByEmail(email)
        if (!sms_otp_secret) return done('No SMS OPT Secret found')
        smsOtpSecret = sms_otp_secret
      })
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/sms/enable')
          .send({ code: authenticator.generate(smsOtpSecret) })
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
                    code: authenticator.generate(smsOtpSecret)
                  })
                  .expect(200)
                  .expect(validJwt())
                  .end(end(done))
              })
          })
      })
  })
})

it('should disable sms mfa for account', (done) => {
  let smsOtpSecret = ''

  registerAndLoginAccount(request).then(({ email }) => {
    request
      .post('/auth/mfa/sms/generate')
      .expect(204)
      .expect(async () => {
        const { sms_otp_secret } = await selectAccountByEmail(email)
        if (!sms_otp_secret) return done('No SMS OPT Secret found')
        smsOtpSecret = sms_otp_secret
      })
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/mfa/sms/enable')
          .send({ code: authenticator.generate(smsOtpSecret) })
          .expect(204)
          .end((err) => {
            if (err) return done(err)

            request
              .post('/auth/mfa/sms/disable')
              .send({ code: authenticator.generate(smsOtpSecret) })
              .expect(204)
              .end(end(done))
          })
      })
  })
})

describe('SMS MFA without cookies', () => {
  it('should generate a secret', (done) => {
    let jwtToken = ''

    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(200)
        .expect(saveJwt((j) => (jwtToken = j)))
        .end((err) => {
          if (err) return done(err)

          request
            .post('/auth/mfa/sms/generate')
            .set({ Authorization: `Bearer ${jwtToken}` })
            .expect(204)
            .expect(async () => {
              const { sms_otp_secret } = await selectAccountByEmail(email)
              expect(sms_otp_secret).toBeString()
            })
            .end(end(done))
        })
    })
  })

  it('should enable sms mfa for account', (done) => {
    let jwtToken = ''
    let smsOtpSecret = ''

    registerAccount(request).then(({ email, password }) => {
      request
        .post('/auth/login')
        .send({ email, password, cookie: false })
        .expect(200)
        .expect(saveJwt((j) => (jwtToken = j)))
        .end((err) => {
          if (err) return done(err)

          request
            .post('/auth/mfa/sms/generate')
            .set({ Authorization: `Bearer ${jwtToken}` })
            .expect(204)
            .expect(async () => {
              const { sms_otp_secret } = await selectAccountByEmail(email)
              if (!sms_otp_secret) return done('No SMS OPT Secret found')
              smsOtpSecret = sms_otp_secret
            })
            .end((err) => {
              if (err) return done(err)

              request
                .post('/auth/mfa/sms/enable')
                .set({ Authorization: `Bearer ${jwtToken}` })
                .send({ code: authenticator.generate(smsOtpSecret) })
                .expect(204)
                .end(end(done))
            })
        })
    })
  })

  it('should sign the account in (sms mfa)', (done) => {
    let smsOtpSecret = ''
    let ticket = ''

    registerAndLoginAccount(request).then(({ email, password }) => {
      request
        .post('/auth/mfa/sms/generate')
        .expect(204)
        .expect(async () => {
          const { sms_otp_secret } = await selectAccountByEmail(email)
          if (!sms_otp_secret) return done('No SMS OPT Secret found')
          smsOtpSecret = sms_otp_secret
        })
        .end((err) => {
          if (err) return done(err)

          request
            .post('/auth/mfa/sms/enable')
            .send({ code: authenticator.generate(smsOtpSecret) })
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
                      code: authenticator.generate(smsOtpSecret),
                      cookie: false
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

  it('should disable sms mfa for account', (done) => {
    let smsOtpSecret = ''
    let ticket = ''
    let jwtToken = ''

    registerAndLoginAccount(request).then(({ email, password }) => {
      request
        .post('/auth/mfa/sms/generate')
        .expect(204)
        .expect(async () => {
          const { sms_otp_secret } = await selectAccountByEmail(email)
          if (!sms_otp_secret) return done('No SMS OPT Secret found')
          smsOtpSecret = sms_otp_secret
        })
        .end((err) => {
          if (err) return done(err)

          request
            .post('/auth/mfa/sms/enable')
            .send({ code: authenticator.generate(smsOtpSecret) })
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
                      code: authenticator.generate(smsOtpSecret),
                      cookie: false
                    })
                    .expect(200)
                    .expect(validJwt())
                    .expect(saveJwt((j) => (jwtToken = j)))
                    .expect(validRefreshToken())
                    .end((err) => {
                      if (err) return done(err)

                      request
                        .post('/auth/mfa/sms/disable')
                        .set({ Authorization: `Bearer ${jwtToken}` })
                        .send({ code: authenticator.generate(smsOtpSecret) })
                        .expect(204)
                        .end(end(done))
                    })
                })
            })
        })
    })
  })
})
