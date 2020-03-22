import 'jest-extended'
import { authenticator } from 'otplib'
import { request, user } from '@shared/test-utils'

let otpSecret: string
let userTicket: string

it('should generate a secret', async () => {
  const { body, status } = await request
    .post('/auth/mfa/generate')
    .set('Authorization', `Bearer ${user.token}`)

  /**
   * Save OTP secret to globally scoped variable.
   */
  otpSecret = body.otp_secret

  expect(status).toEqual(200)

  expect(body.image_url).toBeString()
  expect(body.otp_secret).toBeString()
})

it('should enable mfa for user', async () => {
  const { status } = await request
    .post('/auth/mfa/enable')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})

it('should return a ticket', async () => {
  const { body, status } = await request
    .post('/auth/login')
    .send({ email: user.email, password: user.password })

  /**
   * Save ticket to globally scoped varaible.
   */
  userTicket = body.ticket

  expect(status).toEqual(200)

  expect(body.mfa).toBeTrue()
  expect(body.ticket).toBeString()
})

it('should sign the user in (mfa)', async () => {
  const { body, status } = await request.post('/auth/mfa/totp').send({
    ticket: userTicket,
    code: authenticator.generate(otpSecret)
  })

  /**
   * Save JWT token to globally scoped varaible.
   */
  user.token = body.jwt_token

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should disable mfa for user', async () => {
  const { status } = await request
    .post('/auth/mfa/disable')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ code: authenticator.generate(otpSecret) })

  expect(status).toEqual(204)
})
