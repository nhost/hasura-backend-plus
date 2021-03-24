import 'jest-extended'

import { account, getUserId, request } from '@test/test-mock-account'

import fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const filePath = 'package.json'
let fileToken: string

it('should not have any files', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(0)
})

it('should upload a new file', async () => {
  const {
    status,
    body: {
      Metadata: { token }
    }
  } = await request.post(`/storage/o/user/${getUserId()}/${filePath}`).attach('file', filePath)
  expect(status).toEqual(200)
  expect(token).toBeString()
  fileToken = token
})

it('should revoke and generate new token', async () => {
  const {
    status,
    body: {
      Metadata: { token }
    }
  } = await request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'revoke-token' })
    .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })

  expect(status).toEqual(200)
  expect(token).not.toEqual(fileToken)
  fileToken = token
})

it('should fail to revoke token on incorrect admin secret', async () => {
  const { status } = await request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'revoke-token' })
    .set({ 'x-admin-secret': 'incorrect-admin-secret' })

  expect(status).toEqual(403)
})

it('should fail with non existing action with correct admin secret', async () => {
  const { status } = await request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'non-existing' })
    .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })

  expect(status).toEqual(400)
})

it('should fail to with incorrect action and incorrect admin secret', async () => {
  const { status } = await request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'non-existing' })
    .set({ 'x-admin-secret': 'incorrect-admin-secret' })

  expect(status).toEqual(400)
})

it('should include one file', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(1)
})

it('should fail if trying to upload, without a file attached', async () => {
  const { status } = await request.post(`/storage/o/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(400)
})

it('should update an existing file', async () => {
  const { status } = await request
    .post(`/storage/o/user/${getUserId()}/${filePath}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should not upload file on missing file name in correct path', async () => {
  const { status } = await request.post(`/storage/o/user/${getUserId()}/`).attach('file', filePath)
  expect(status).toEqual(404)
})

it('should not upload file on incorrect file path', async () => {
  const { status } = await request
    .post(`/storage/o/user/${getUserId()}/123/`)
    .attach('file', filePath)
  expect(status).toEqual(403)
})

it('should still only include one file', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(1)
})

it('should not update an hypothetical file of another hypothetical user', async () => {
  const { status } = await request
    .post(`/storage/o/user/another-user/another-file`)
    .attach('file', filePath)
  expect(status).toEqual(403)
})

it('should get file', async () => {
  const { status, text } = await request.get(`/storage/o/user/${getUserId()}/${filePath}`)
  const fileData = await readFile(filePath, 'utf8')
  expect(status).toEqual(200)
  expect(text).toEqual(fileData)
})

describe('Tests as an unauthenticated user', () => {
  beforeAll(async () => {
    await request.post(`/auth/logout`)
  })

  afterAll(async () => {
    await request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: true })
  })

  it('should get file from the token stored in the file metadata while unauthenticated', async () => {
    const { status, text } = await request
      .get(`/storage/o/user/${getUserId()}/${filePath}`)
      .query({ token: fileToken })
    const fileData = await readFile(filePath, 'utf8')
    expect(status).toEqual(200)
    expect(text).toEqual(fileData)
  })

  it('should not get file from incorrect token while unauthenticated', async () => {
    const { status } = await request
      .get(`/storage/o/user/${getUserId()}/${filePath}`)
      .query({ token: 'incorrect' })
    expect(status).toEqual(403)
  })

  it('should not get file without authentication nor token', async () => {
    const { status } = await request.get(`/storage/o/user/${getUserId()}/${filePath}`)
    expect(status).toEqual(403)
  })
  // TODO attempt to get the file from another authenticated user
})

// it(`should update an existing file's metadata`, async () => {
//   const { status } = await request
//     .post(`/storage/m/user/${getUserId()}/${filePath}`)
//     .query({ description: newDescription })
//   expect(status).toEqual(200)
// })

it('should get file metadata', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(200)
  expect(body.Metadata.token).toEqual(fileToken)
})

it('should get the headers of all the user files', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(1)
})

it('should get a zip that contains all user files', async () => {
  const { status, text } = await request.get(`/storage/o/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(text).toBeTruthy()
  // TODO unzip and compare the file(s)
})

it('should delete file', async () => {
  const { status } = await request.delete(`/storage/o/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(204)
})

it('should not be able to get deleted file', async () => {
  const { status } = await request.get(`/storage/o/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(404)
})

it('should get the headers of no files', async () => {
  const { status, body } = await request.get(`/storage/m/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(0)
})

it('should upload a new imae', async () => {
  const { status } = await request
    .post(`/storage/o/public/example.jpg`)
    .attach('file', 'test-mocks/example.jpg')
  expect(status).toEqual(200)
})

it('should get image', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg`)
  expect(status).toEqual(200)
})

it('should get image with width and height parameter', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?w=100&h=200`)
  expect(status).toEqual(200)
})

it('should get image with width, height and quality parameter', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?w=100&h=200&q=50`)
  expect(status).toEqual(200)
})

it('should fail to get image with width parameter of -1', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?w=-1`)
  expect(status).toEqual(400)
})

it('should fail to get image with width parameter of 10000', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?w=10000`)
  expect(status).toEqual(400)
})

it('should fail to get image with height parameter of -1', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?h=-1`)
  expect(status).toEqual(400)
})

it('should fail to get image with height parameter of 10000', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?h=10000`)
  expect(status).toEqual(400)
})

it('should fail to get image with quality parameter of -1', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?q=-1`)
  expect(status).toEqual(400)
})

it('should fail to get image with quality parameter of 101', async () => {
  const { status } = await request.get(`/storage/o/public/example.jpg?q=101`)
  expect(status).toEqual(400)
})
