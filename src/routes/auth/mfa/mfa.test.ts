import 'jest-extended'

import { account, request } from '@test/test-mock-account'

import { authenticator } from 'otplib'

let otpSecret: string
let accountTicket: string

it('should generate a secret', async () => {
  const { body, status } = await request.post('/auth/mfa/generate')

  /**
   * Save OTP secret to globally scoped variable.
   */
  otpSecret = body.otp_secret

  expect(status).toEqual(200)

  expect(body.image_url).toBeString()
  expect(body.otp_secret).toBeString()
})

it('should enable mfa for account', async () => {
  const { status } = await request
    .post('/auth/mfa/enable')
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})

it('should return a ticket', async () => {
  const { body, status } = await request
    .post('/auth/login')
    .send({ email: account.email, password: account.password })

  /**
   * Save ticket to globally scoped varaible.
   */
  accountTicket = body.ticket

  expect(status).toEqual(200)

  expect(body.mfa).toBeTrue()
  expect(body.ticket).toBeString()
})

it('should sign the account in (mfa)', async () => {
  const { body, status } = await request.post('/auth/mfa/totp').send({
    ticket: accountTicket,
    code: authenticator.generate(otpSecret)
  })

  /**
   * Save JWT token to globally scoped varaible.
   */
  account.token = body.jwt_token

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should disable mfa for account', async () => {
  const { status } = await request
    .post('/auth/mfa/disable')
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})

describe('MFA without cookies', () => {
  let jwtToken: string

  // to make sure no cookies are set
  it('Should logout user', async () => {
    const { status } = await request.post('/auth/logout')
    expect(status).toEqual(204)
  })

  it('Should login without cookies', async () => {
    const { body, status } = await request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: false })
    // Save JWT token to globally scoped varaible.
    jwtToken = body.jwt_token

    expect(status).toEqual(200)
  })

  it('should generate a secret', async () => {
    const { body, status } = await request
      .post('/auth/mfa/generate')
      .set({ Authorization: `Bearer ${jwtToken}` })

    /**
     * Save OTP secret to globally scoped variable.
     */
    otpSecret = body.otp_secret

    expect(status).toEqual(200)

    expect(body.image_url).toBeString()
    expect(body.otp_secret).toBeString()
  })

  it('should enable mfa for account', async () => {
    const { status } = await request
      .post('/auth/mfa/enable')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ code: authenticator.generate(otpSecret) })

    expect(status).toEqual(204)
  })

  it('should return a ticket', async () => {
    const { body, status } = await request
      .post('/auth/login')
      .send({ email: account.email, password: account.password })

    /**
     * Save ticket to globally scoped varaible.
     */
    accountTicket = body.ticket

    expect(status).toEqual(200)

    expect(body.mfa).toBeTrue()
    expect(body.ticket).toBeString()
  })

  it('should sign the account in (mfa)', async () => {
    const { body, status } = await request.post('/auth/mfa/totp').send({
      ticket: accountTicket,
      code: authenticator.generate(otpSecret),
      cookie: false
    })

    /**
     * Save JWT token to globally scoped varaible.
     */
    jwtToken = body.jwt_token

    expect(status).toEqual(200)

    expect(body.jwt_token).toBeString()
    expect(body.jwt_expires_in).toBeNumber()

    const uuid_regex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
    expect(body.refresh_token).toMatch(uuid_regex)
  })

  it('should disable mfa for account', async () => {
    const { status } = await request
      .post('/auth/mfa/disable')
      .set({ Authorization: `Bearer ${jwtToken}` })
      .send({ code: authenticator.generate(otpSecret) })

    expect(status).toEqual(204)
  })
})
