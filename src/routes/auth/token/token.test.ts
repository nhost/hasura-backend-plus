import 'jest-extended'
import { request, user } from '@shared/test-utils'

it('should refresh the token', async () => {
  const { body, status } = await request.post('/auth/token/refresh')

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

it('should revoke the token', async () => {
  const { status } = await request
    .post('/auth/token/revoke')
    .set('Authorization', `Bearer ${user.token}`)

  expect(status).toEqual(204)
})
