import 'jest-extended'

import { account, request } from '@shared/test-mock-account'

it('should upload a file', async () => {
  const { status } = await request.post('/storage/upload')
  console.log(`Upload test using the account ${account.email}`)
  expect(status).toEqual(200)
})
