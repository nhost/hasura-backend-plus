import 'jest-extended'

import { account, getUserId, request } from '@test/test-mock-account'

import fs from 'fs'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

const readFile = promisify(fs.readFile)
const filePath = 'package.json'
const fileToken = uuidv4()

it('should upload a new file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .query({ token: fileToken })
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should update an existing file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should not update an hypothetical file of another hypothetical user', async () => {
  const { status } = await request
    .post(`/storage/user/another-user/another-file`)
    .attach('file', filePath)
  expect(status).toEqual(403)
})

it('should get file', async () => {
  const { status, text } = await request.get(`/storage/user/${getUserId()}/${filePath}`)
  const fileData = await readFile(filePath, 'utf8')
  expect(status).toEqual(200)
  expect(text).toEqual(fileData)
})

describe('Tests as an authenticated user', () => {
  beforeAll(async () => {
    await request.post(`/auth/logout`)
  })

  afterAll(async () => {
    await request.post('/auth/login').send({ email: account.email, password: account.password })
  })

  it('should get file from the token stored in the file metadata while unauthenticated', async () => {
    const { status, text } = await request
      .get(`/storage/user/${getUserId()}/${filePath}`)
      .query({ token: fileToken })
    const fileData = await readFile(filePath, 'utf8')
    expect(status).toEqual(200)
    expect(text).toEqual(fileData)
  })

  it('should not get file without authentication nor token', async () => {
    const { status } = await request.get(`/storage/user/${getUserId()}/${filePath}`)
    expect(status).toEqual(403)
  })
  // TODO attempt to get the file from another authenticated user
})

it(`should update an existing file's metadata`, async () => {
  const { status } = await request
    .post(`/storage/meta/user/${getUserId()}/${filePath}`)
    .query({ token: 'new value' })
  expect(status).toEqual(200)
})

it('should get file metadata', async () => {
  const {
    status,
    body: {
      Metadata: { filename, token }
    }
  } = await request.get(`/storage/meta/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(200)
  expect(filename).toEqual(filePath)
  expect(token).toEqual('new value')
})

it('should get the headers of all the user files', async () => {
  const { status, body } = await request.get(`/storage/meta/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(1)
})

it('should get a zip that contains all user files', async () => {
  const { status, text } = await request.get(`/storage/user/${getUserId()}/`)
  expect(status).toEqual(200)
  expect(text).toBeTruthy()
  // TODO unzip and compare the file(s)
})

it('should delete file metadata', async () => {
  const { status } = await request.delete(`/storage/meta/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(204)
  const {
    status: getStatus,
    body: { Metadata }
  } = await request.get(`/storage/meta/user/${getUserId()}/${filePath}`)
  expect(getStatus).toEqual(200)
  expect(Metadata).toBeEmpty()
})

it('should delete file', async () => {
  const { status } = await request.delete(`/storage/user/${getUserId()}/${filePath}`)
  expect(status).toEqual(204)
})
