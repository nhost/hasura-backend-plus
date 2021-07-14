import 'jest-extended'

import { request } from '@test/server'
import { request as gqlRequest } from '@shared/request'
import { end, saveJwt } from '@test/supertest-shared-utils'
import { generateRandomString, registerAccount, registerAndLoginAccount } from '@test/utils'
import { updateAccountByEmail } from '@shared/queries'

it('should change the password from the old password', (done) => {
  const new_password = generateRandomString()

  registerAndLoginAccount(request).then(({ password }) => {
    request
      .post('/auth/change-password')
      .send({ old_password: password, new_password })
      .expect(204)
      .end(end(done))
  })
})

it('should change the password if current password is null', async () => {
  const new_password = generateRandomString()

  const { email } = await registerAndLoginAccount(request)

  // update user's password to null
  await gqlRequest(updateAccountByEmail, {
    account_email: email,
    account: {
      password_hash: null
    }
  })

  await request
    .post('/auth/change-password')
    .send({ old_password: 'does not matter', new_password })
    .expect(204)
})

it('should fail to change the password if with wrong old password', async () => {
  const new_password = generateRandomString()

  const { email } = await registerAndLoginAccount(request)

  // update user's password to null
  await gqlRequest(updateAccountByEmail, {
    account_email: email,
    account: {
      password_hash: 'other hash'
    }
  })

  await request
    .post('/auth/change-password')
    .send({ old_password: 'does not matter', new_password })
    .expect(401)
})

it('should change password using old password without cookies', (done) => {
  const new_password = generateRandomString()
  let jwtToken = ''

  registerAccount(request).then(({ email, password }) => {
    request
      .post('/auth/login')
      .send({ email, password, cookie: false })
      .expect(saveJwt((j) => (jwtToken = j)))
      .end((err) => {
        if (err) return done(err)

        request
          .post('/auth/change-password')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .send({ old_password: password, new_password })
          .expect(204)
          .end(end(done))
      })
  })
})
