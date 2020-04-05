import 'jest-extended'
import fs from 'fs'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

import { account, request, getUserId } from '@shared/test-mock-account'

const readFile = promisify(fs.readFile)
const filePath = 'package.json'
const fileToken = uuidv4()

// TODO shoud get a list of files. Either a duplicate of metadata list, or create a zip file of the listed objects
// TODO should list metadata
// TODO test forbidden accesses

it('should upload a new file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
    .query({ token: fileToken })
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should update an existing file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should not update an hypothetical file of another hypothetical user', async () => {
  const { status } = await request
    .post(`/storage/user/another-user/another-file`)
    .set('Authorization', `Bearer ${account.token}`)
    .attach('file', filePath)
  expect(status).toEqual(403)
})

it('should get file from user authentication', async () => {
  const { status, text } = await request
    .get(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  const fileData = await readFile(filePath, 'utf8')
  expect(status).toEqual(200)
  expect(text).toEqual(fileData)
})

it('should get file from the token stored in the file metadata', async () => {
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

it(`should update an existing file's metadata`, async () => {
  const { status } = await request
    .post(`/storage/meta/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
    .query({ token: 'new value' })
  expect(status).toEqual(200)
})

it('should get file metadata', async () => {
  const {
    status,
    body: {
      Metadata: { filename, token }
    }
  } = await request
    .get(`/storage/meta/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(200)
  expect(filename).toEqual(filePath)
  expect(token).toEqual('new value')
})

it('should get the headers of all the user files', async () => {
  const { status, body } = await request
    .get(`/storage/meta/user/${getUserId()}/`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(200)
  expect(body).toBeArrayOfSize(1)
})

it('should get a zip that contains all user files', async () => {
  const { status, text } = await request
    .get(`/storage/user/${getUserId()}/`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(200)
  expect(text).toBeTruthy()
  // TODO unzip and compare the file(s)
})

it('should delete file metadata', async () => {
  const { status } = await request
    .delete(`/storage/meta/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(204)
  const {
    status: getStatus,
    body: { Metadata }
  } = await request
    .get(`/storage/meta/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(getStatus).toEqual(200)
  expect(Metadata).toBeEmpty()
})

it('should delete file', async () => {
  const { status } = await request
    .delete(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(204)
})
