import { SuperTest, Test, agent } from 'supertest'

import { AUTO_ACTIVATE, SMTP_HOST } from '@shared/config'
import { request as admin } from '@shared/request'
import { selectUserByUsername } from '@shared/queries'
import { HasuraUserData } from '@shared/helpers'
import fetch, { Response } from 'node-fetch'

import { app } from '../server'

export const generateRandomString = () => Math.random().toString(36).replace('0.', '')

export let request: SuperTest<Test>

interface TestUser {
  username: string
  email: string
  password: string
  token?: string
}

export const createUser = (): TestUser => {
  const username = generateRandomString()
  return {
    username,
    email: `${username}@${generateRandomString()}.com`,
    password: generateRandomString()
  }
}

export let user: TestUser

interface MailhogEmailAddress {
  Relays: string | null
  Mailbox: string
  Domain: string
  Params: string
}
interface MailhogMessage {
  ID: string
  From: MailhogEmailAddress
  To: MailhogEmailAddress[]
  Content: {
    Headers: {
      'Content-Type': string[]
      Date: string[]
      From: string[]
      'MIME-Version': string[]
      'Message-ID': string[]
      Received: string[]
      'Return-Path': string[]
      Subject: string[]
      To: string[]
      [key: string]: string[]
    }
    Body: string
    Size: number
  }
  Created: string
  Raw: {
    From: string
    To: string[]
    Data: string
  }
}

export interface MailhogSearchResult {
  total: number
  count: number
  start: number
  items: MailhogMessage[]
}

export const mailHogSearch = async (query: string, fields = 'to'): Promise<MailhogMessage[]> => {
  const response = await fetch(
    `http://${SMTP_HOST}:8025/api/v2/search?kind=${fields}&query=${query}`
  )
  return ((await response.json()) as MailhogSearchResult).items
}

export const deleteMailHogEmail = async ({ ID }: MailhogMessage): Promise<Response> =>
  await fetch(`http://${SMTP_HOST}:8025/api/v1/messages/${ID}`, { method: 'DELETE' })

export const deleteEmailsOfUser = async (email: string): Promise<void> =>
  (await mailHogSearch(email)).forEach(async (message) => await deleteMailHogEmail(message))

// * Code that is executed before any jest test file that imports test-utiles
beforeAll(async () => {
  request = agent(app) // * Create the SuperTest agent
  // * Create a mock user
  const { username, email, password } = createUser()
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

// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  // * Delete the user
  await request.post('/auth/user/delete').set('Authorization', `Bearer ${user.token}`)
  // * Remove any message sent to this user
  await deleteEmailsOfUser(user.email)
})
