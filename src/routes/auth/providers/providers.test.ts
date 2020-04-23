/* eslint-disable jest/no-standalone-expect */
import 'jest-extended'
// import { initAgent } from '@shared/test-utils'
import { SERVER_URL, PROVIDER_SUCCESS_REDIRECT, PROVIDERS } from '@shared/config'
import { agent } from 'supertest'
import { server } from '../../../start'
import { itif } from '@shared/test-utils'

// test('Oauth routes should not exist when disabled', async () => {
//   const agent = initAgent({ PROVIDERS: {} })
//   const github = await agent.get('/auth/providers/github')
//   expect(github.status).toEqual(404)
//   const google = await agent.get('/auth/providers/google')
//   expect(google.status).toEqual(404)
// })

// test('Github Oauth should be configured correctly', async () => {
//   expect(() => initAgent({ PROVIDERS: { github: { clientSecret: undefined } } })).toThrow(
//     'Missing environment variables for GitHub OAuth.'
//   )
// })

// TODO test functions in ./utils.ts
// ? end-to-end tests?
agent(server) // * Create the SuperTest agent

// * Code that is executed after any jest test file that imports test-utiles
afterAll(async () => {
  await server.close()
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

  expect(await page.url()).toBe(PROVIDER_SUCCESS_REDIRECT)
})
