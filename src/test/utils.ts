import fetch, { Response } from 'node-fetch'
import { SuperTest, Test } from 'supertest'

import { APPLICATION } from '@shared/config'

import { getClaims } from '@shared/jwt'

export interface AccountLoginData {
  email: string
  password: string
}

export type AccountData = AccountLoginData & {
  id: string
  token: string
  refresh_token: string
  jwtToken: string
}

export const generateRandomString = (): string => Math.random().toString(36).replace('0.', '')

export const generateRandomEmail = () => `${generateRandomString()}@${generateRandomString()}.com`

const getUserId = (token: string): string => getClaims(token)['x-hasura-user-id']

export async function withEnv(
  env: Record<string, string>,
  agent: SuperTest<Test>,
  cb?: () => Promise<unknown>,
  rollbackEnv?: Record<string, string>
) {
  await agent.post('/change-env').send(env)
  if (cb) await cb()
  if (rollbackEnv) {
    await agent.post('/change-env').send(rollbackEnv)
  }
}

export const createAccountLoginData = (): AccountLoginData => ({
  email: `${generateRandomString()}@${generateRandomString()}.com`,
  password: generateRandomString()
})

export const registerAccount = async (
  agent: SuperTest<Test>,
  user_data: Record<string, unknown> = {}
): Promise<AccountLoginData> => {
  const accountLoginData = createAccountLoginData()

  const oldAutoActivateNewUsers = await agent
    .get('/env/AUTO_ACTIVATE_NEW_USERS')
    .then((res) => res.text)
  const customFields = await agent.get('/env/REGISTRATION_CUSTOM_FIELDS').then((res) => res.text)

  await withEnv(
    {
      AUTO_ACTIVATE_NEW_USERS: 'true',
      REGISTRATION_CUSTOM_FIELDS: Object.keys(user_data).join(','),
      JWT_CUSTOM_FIELDS: Object.keys(user_data).join(','),
      MAGIC_LINK_ENABLED: 'false'
    },
    agent,
    async () => {
      await agent
        .post('/auth/register')
        .send({
          ...accountLoginData,
          user_data
        })
        .then((res) => res.body)
    },
    {
      AUTO_ACTIVATE_NEW_USERS: oldAutoActivateNewUsers,
      REGISTRATION_CUSTOM_FIELDS: customFields
    }
  )

  return accountLoginData
}

export const loginAccount = async (
  agent: SuperTest<Test>,
  accountLoginData: AccountLoginData
): Promise<AccountData> => {
  const login = await agent.post('/auth/login').send(accountLoginData)

  try {
    getUserId(login.body.jwt_token)
  } catch (e) {
    console.log('jwt', accountLoginData, login.body)
  }

  if (login.body.error) {
    throw new Error(`${login.body.statusCode} ${login.body.error}: ${login.body.message}`)
  }

  return {
    ...accountLoginData,
    token: login.body.jwt_token as string,
    refresh_token: login.body.refresh_token as string,
    jwtToken: login.body.jwt_token as string,
    id: getUserId(login.body.jwt_token)
  }
}

export const registerAndLoginAccount = async (agent: SuperTest<Test>) => {
  return await loginAccount(agent, await registerAccount(agent))
}

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
    `http://${APPLICATION.SMTP_HOST}:8025/api/v2/search?kind=${fields}&query=${query}`
  )
  return ((await response.json()) as MailhogSearchResult).items
}

export const deleteMailHogEmail = async ({ ID }: MailhogMessage): Promise<Response> =>
  await fetch(`http://${APPLICATION.SMTP_HOST}:8025/api/v1/messages/${ID}`, { method: 'DELETE' })

export const deleteEmailsOfAccount = async (email: string): Promise<void> =>
  (await mailHogSearch(email)).forEach(async (message) => await deleteMailHogEmail(message))

export const getHeaderFromLatestEmailAndDelete = async (email: string, header: string) => {
  const [message] = await mailHogSearch(email)

  if (!message) return

  const headerValue = message.Content.Headers[header][0]
  await deleteMailHogEmail(message)

  return headerValue
}

export const deleteAccount = async (
  agent: SuperTest<Test>,
  account: AccountLoginData
): Promise<void> => {
  // * Delete the account
  await agent.post('/auth/delete')
  // * Remove any message sent to this account
  await deleteEmailsOfAccount(account.email)
}
