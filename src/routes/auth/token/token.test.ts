import 'jest-extended'

import { request } from '@test/test-mock-account'

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
