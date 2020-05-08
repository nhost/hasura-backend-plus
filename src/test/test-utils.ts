import fetch, { Response } from 'node-fetch'
import request, { SuperTest, Test } from 'supertest'

import { SMTP_HOST, AUTO_ACTIVATE_NEW_USERS } from '@shared/config'
import { generateRandomString, selectAccountByEmail } from '@shared/helpers'

// eslint-disable-next-line @typescript-eslint/no-empty-function
console.error = function (): void {} // Disable the errors that will be raised by the tests

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

export interface TestAccount {
  email: string
  password: string
  token?: string
}

export const createAccount = (): TestAccount => ({
  email: `${generateRandomString()}@${generateRandomString()}.com`,
  password: generateRandomString()
})

export const mailHogSearch = async (query: string, fields = 'to'): Promise<MailhogMessage[]> => {
  const response = await fetch(
    `http://${SMTP_HOST}:8025/api/v2/search?kind=${fields}&query=${query}`
  )
  return ((await response.json()) as MailhogSearchResult).items
}

export const deleteMailHogEmail = async ({ ID }: MailhogMessage): Promise<Response> =>
  await fetch(`http://${SMTP_HOST}:8025/api/v1/messages/${ID}`, { method: 'DELETE' })

export const deleteEmailsOfAccount = async (email: string): Promise<void> =>
  (await mailHogSearch(email)).forEach(async (message) => await deleteMailHogEmail(message))

// Init a superset agent with possibly mocked config constants
export const initAgent = (
  config: {
    [key: string]: boolean | string | number | string[] | undefined | object
  } = {}
): SuperTest<Test> => {
  jest.mock('@shared/config', () => ({
    ...jest.requireActual('@shared/config'),
    ...config
  }))
  jest.resetModules() // TODO only reset '../server'
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { app } = require('../server')
  return request(app)
}

export const itif = (condition: boolean): jest.It => (condition ? it : it.skip)

export const registerAccount = async (agent: SuperTest<Test>): Promise<TestAccount> => {
  const { email, password } = createAccount()
  await agent.post('/auth/register').send({ email, password })
  if (!AUTO_ACTIVATE_NEW_USERS) {
    const { ticket } = await selectAccountByEmail(email)
    await agent.get(`/auth/activate?ticket=${ticket}`)
    await deleteEmailsOfAccount(email)
  }
  const res = await agent.post('/auth/login').send({ email, password })
  // * Set the use variable so it is accessible to the jest test file
  return {
    email,
    password,
    token: res.body.jwt_token
  }
}

export const deleteAccount = async (
  agent: SuperTest<Test>,
  account: TestAccount
): Promise<void> => {
  // * Delete the account
  await agent.post('/auth/delete')
  // * Remove any message sent to this account
  await deleteEmailsOfAccount(account.email)
}
