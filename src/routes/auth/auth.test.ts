import 'jest-extended'

import { deleteUserById, selectUserByUsername } from '@shared/queries'

import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { app } from '../../server'
import request from 'supertest'

const { AUTO_ACTIVATE = false } = process.env

/**
 * Dummy user information.
 */
const username = 'jfxa8eybqi'
const email = 'jfxa8eybqi@kg2cuzbqaw.com'
const password = '1d5e6ceb-f42a-4f2e-b24d-8f1b925971c1'

it('should register', async () => {
  const { body, status } = await request(app)
    .post('/auth/register')
    .send({ email, password, username })

  expect(body).toBeEmpty()
  expect(status).toEqual(204)
})

/**
 * Only run this test if `AUTO_ACTIVATE` is false.
 */
if (!AUTO_ACTIVATE) {
  it('should activate', async () => {
    const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
    const ticket = hasuraData.private_user_accounts[0].user.ticket

    const { body, status } = await request(app)
      .post('/auth/user/activate')
      .send({ ticket })

    expect(body).toBeEmpty()
    expect(status).toEqual(204)
  })
}

it('should sign in', async () => {
  const { body, status } = await request(app)
    .post('/auth/login')
    .send({ email, password })

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

// eslint-disable-next-line jest/no-commented-out-tests
/*it('should refresh', async () => {
  const { body, status } = await request(app).post('/auth/token/refresh')

  expect(status).toEqual(200)

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})*/

/**
 * Goodbye test user!
 */
afterAll(async () => {
  const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
  const user_id = hasuraData.private_user_accounts[0].user.id

  await admin(deleteUserById, { user_id })
})
