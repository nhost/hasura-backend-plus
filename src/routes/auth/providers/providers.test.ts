/* eslint-disable jest/no-standalone-expect */
import 'jest-extended'
import { SERVER_URL, PROVIDER_SUCCESS_REDIRECT, PROVIDERS, PORT } from '@shared/config'
import { agent } from 'supertest'
import { app } from '../../../server'
import { itif } from '@test/test-utils'

// it('Oauth routes should not exist when disabled', async () => {
//   const tempAgent = initAgent({ PROVIDERS: {} })
//   const github = await tempAgent.get('/auth/providers/github')
//   expect(github.status).toEqual(404)
//   const google = await tempAgent.get('/auth/providers/google')
//   expect(google.status).toEqual(404)
// })

// it('Github Oauth should be configured correctly', async () => {
//   expect(() => initAgent({ PROVIDERS: { github: { clientSecret: undefined } } })).toThrow(
//     'Missing environment variables for GitHub OAuth.'
//   )
// })

// TODO test functions in ./utils.ts
const server = app.listen(PORT)
agent(server)
// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  server.close()
})

itif(
  !!PROVIDERS.github && !!process.env.TEST_GITHUB_USERNAME && !!process.env.TEST_GITHUB_PASSWORD
)('should register from a GitHub account', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  jest.setTimeout(60000)
  await page.goto(`${SERVER_URL}/auth/providers/github`)
  await expect(page).toFill('#login_field', process.env.TEST_GITHUB_USERNAME as string)
  await expect(page).toFill('#password', process.env.TEST_GITHUB_PASSWORD as string)
  await expect(page).toClick('[name="commit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
  // Wait for the OAuth redirection
  if (page.url() !== PROVIDER_SUCCESS_REDIRECT) await page.waitFor(4000)
  expect(page.url()).toBe(PROVIDER_SUCCESS_REDIRECT)
})

itif(
  !!PROVIDERS.google && !!process.env.TEST_GOOGLE_USERNAME && !!process.env.TEST_GOOGLE_PASSWORD
)('should register from a Google account', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  jest.setTimeout(60000)
  // const page = await browser.newPage()
  await page.goto(`${SERVER_URL}/auth/providers/google`)
  await expect(page).toFill('#identifierId', process.env.TEST_GOOGLE_USERNAME as string)
  await expect(page).toClick('#identifierNext')

  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  await expect(page).toFill("input[name='password']", process.env.TEST_GOOGLE_PASSWORD as string)
  await expect(page).toClick('#passwordNext')

  await page.waitForNavigation({ waitUntil: 'networkidle0' })
  // Wait for the OAuth redirection
  if (page.url() !== PROVIDER_SUCCESS_REDIRECT) await page.waitFor(4000)

  expect(await page.url()).toBe(PROVIDER_SUCCESS_REDIRECT)
})
