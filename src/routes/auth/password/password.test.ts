import 'jest-extended'
import { request, user, generateRandomString } from '@shared/test-utils'
import { request as admin } from '@shared/request'
import { selectUserByUsername } from '@shared/queries'
import { HasuraUserData } from '@shared/helpers'

it('should change the user password from the old password', async () => {
  const new_password = generateRandomString()
  const { status } = await request
    .post('/auth/password/reset')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ old_password: user.password, new_password })
  user.password = new_password
  expect(status).toEqual(204)
  // ? check if the hash has been changed in the DB?
  // expect(body.jwt_token).toBeString()
  // expect(body.jwt_expires_in).toBeNumber()
})

it('should change the user password from a ticket', async () => {
  const hasuraData = (await admin(selectUserByUsername, {
    username: user.username
  })) as HasuraUserData
  const ticket = hasuraData.private_user_accounts[0].user.ticket

  const { status } = await request.post('/auth/password/reset').send({
    ticket,
    new_password: user.password
  })
  // ? check if the hash has been changed in the DB?
  expect(status).toEqual(204)
})

// TODO check if the email has been sent
