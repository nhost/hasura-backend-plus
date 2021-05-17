import 'jest-extended'

import { request } from '@test/server'
import { end, saveJwt } from '@test/supertest-shared-utils'
import { generateRandomString, registerAccount, registerAndLoginAccount } from '@test/utils'

it('should change the password from the old password', (done) => {
  const new_password = generateRandomString()

  registerAndLoginAccount(request).then(({email, password}) => {
    request
      .post('/auth/change-password')
      .send({ old_password: password, new_password })
      .expect(204)
      .end(end(done))
  })
  // ? check if the hash has been changed in the DB?
})

it('should change password using old password without cookies', (done) => {
  const new_password = generateRandomString()
  let jwtToken = ''

  registerAccount(request).then(({email, password}) => {
    request
      .post('/auth/login')
      .send({ email, password, cookie: false})
      .expect(saveJwt(j => jwtToken = j))
      .end((err) => {
        if(err) return done(err)

        request
          .post('/auth/change-password')
          .set({ Authorization: `Bearer ${jwtToken}` })
          .send({ old_password: password, new_password })
          .expect(204)
          .end(end(done))
      })
  })
})
