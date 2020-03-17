import 'jest-extended'

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
  const { body, status } = await request(app)
    .post('/auth/register')
    .send({ email, password, username })

  expect(body).toBeEmpty()
  expect(status).toEqual(204)
})

it('should log the user in', async () => {
  const { body } = await request(app)
    .post('/auth/login')
    .send({ email, password })

  expect(body.jwt_token).toBeString()
  expect(body.jwt_expires_in).toBeNumber()
})

/**
 * Goodbye test user!
 */
afterAll(async () => {
  const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
  const user_id = hasuraData.private_user_accounts[0].user.id
  await admin(deleteUserById, { user_id })
})
