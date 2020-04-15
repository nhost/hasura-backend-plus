import 'jest-extended'
import { initAgent } from '@shared/test-utils'

test('Github Oauth route should not exist when disabled', async () => {
  const agent = initAgent({ AUTH_GITHUB_ENABLE: false })
  const { status } = await agent.get('/auth/providers/github')
  expect(status).toEqual(404)
})

test('Google Oauth route should not exist when disabled', async () => {
  const agent = initAgent({ AUTH_GOOGLE_ENABLE: false })
  const { status } = await agent.get('/auth/providers/github')
  expect(status).toEqual(404)
})

test('Github Oauth should be configured correctly', async () => {
  expect(() => initAgent({ AUTH_GITHUB_CLIENT_SECRET: undefined })).toThrow(
    'Missing environment variables for GitHub OAuth.'
  )
})

// TODO test functions in ./utils.ts
// ? end-to-end tests?
