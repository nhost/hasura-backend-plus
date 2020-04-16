import 'jest-extended'
import { initAgent } from '@shared/test-utils'

test('Oauth routes should not exist when disabled', async () => {
  const agent = initAgent({ AUTH_PROVIDERS: {} })
  const github = await agent.get('/auth/providers/github')
  expect(github.status).toEqual(404)
  const google = await agent.get('/auth/providers/google')
  expect(google.status).toEqual(404)
})

test('Github Oauth should be configured correctly', async () => {
  expect(() => initAgent({ AUTH_PROVIDERS: { github: { clientSecret: undefined } } })).toThrow(
    'Missing environment variables for GitHub OAuth.'
  )
})

// TODO test functions in ./utils.ts
// ? end-to-end tests?
