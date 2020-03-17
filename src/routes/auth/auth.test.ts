import { deleteUserById, selectUserByUsername } from '@shared/queries'

import { HasuraUserData } from '@shared/helpers'
import { request as admin } from '@shared/request'
import { app } from '../../server'
import request from 'supertest'

/**
 * Dummy user information.
 */
const username = 'jfxa8eybqi'
const email = 'jfxa8eybqi@kg2cuzbqaw.com'
const password = '1d5e6ceb-f42a-4f2e-b24d-8f1b925971c1'

it('should create an account', async () => {
  const { status } = await request(app)
    .post('/auth/register')
    .send({ email, password, username })

  expect(status).toEqual(204)
})

it('should log the user in', async () => {
  const { body } = await request(app)
    .post('/auth/login')
    .send({ password, email })

  expect(body.jwt_token).toBeDefined()
})

/**
 * Goodbye test user!
 */
afterAll(async () => {
  let hasuraData: HasuraUserData

  try {
    hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
  } catch (err) {
    throw new Error(err)
  }

  const user_id = hasuraData.private_user_accounts[0].user.id

  await admin(deleteUserById, { user_id })
})
