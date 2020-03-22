import { SuperTest, Test, agent } from 'supertest'

import { AUTO_ACTIVATE } from '@shared/config'
import { request as admin } from '@shared/request'
import { selectUserByUsername } from '@shared/queries'
import { HasuraUserData } from '@shared/helpers'

import { app } from '../server'

export const generateRandomString = () =>
  Math.random()
    .toString(36)
    .replace('0.', '')

export let request: SuperTest<Test>
export let user: {
  username: string
  email: string
  password: string
  token: string
}

beforeAll(async () => {
  request = agent(app) // * Create the SuperTest agent
  // * Create a mock user
  const username = generateRandomString()
  const email = `${username}@${generateRandomString()}.com`
  const password = generateRandomString()
  await request.post('/auth/register').send({ username, email, password })
  if (!AUTO_ACTIVATE) {
    const hasuraData = (await admin(selectUserByUsername, { username })) as HasuraUserData
    const ticket = hasuraData.private_user_accounts[0].user.ticket
    await request.get(`/auth/user/activate?ticket=${ticket}`)
  }
  const {
    body: { jwt_token: token }
  } = await request.post('/auth/login').send({ email, password })
  // * Set the use variable so it is accessible to the jest test file
  user = {
    username,
    email,
    password,
    token
  }
})

afterAll(async () => {
  // * Delete the user
  await request.post('/auth/user/delete').set('Authorization', `Bearer ${user.token}`)
})
