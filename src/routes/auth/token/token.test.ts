import 'jest-extended'

import { account, request } from '@test/test-mock-account'

it('should refresh the token', async () => {
  const { body, status } = await request.get('/auth/token/refresh')

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should revoke the token', async () => {
  const { status } = await request.post('/auth/token/revoke')

  expect(status).toEqual(204)
})

describe('handle refresh tokens without cookies', () => {
  let jwtToken: string
  let refreshToken: string

  // to make sure no cookies are set
  it('Should logout user', async () => {
    const { status } = await request.post('/auth/logout')
    expect(status).toEqual(204)
  })

  it('Should login user', async () => {
    const { body, status } = await request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: false })

    // Save refresh token to globally scoped variable.
    refreshToken = body.refresh_token
    jwtToken = body.jwt_token

    expect(status).toEqual(200)
  })

  it('should refresh the token', async () => {
    const { body, status } = await request
      .get('/auth/token/refresh')
      .query({ refresh_token: refreshToken })

    expect(status).toEqual(200)

    expect(body.jwt_token).toBeString()
    expect(body.jwt_expires_in).toBeNumber()
    expect(body.refresh_token).toBeString()
  })

  it('should revoke the token', async () => {
    const { status } = await request
      .post('/auth/token/revoke')
      .set({ Authorization: `Bearer ${jwtToken}` })

    expect(status).toEqual(204)
  })
})
