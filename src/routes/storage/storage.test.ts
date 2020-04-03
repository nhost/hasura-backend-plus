import 'jest-extended'
import fs from 'fs'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

import { account, request, getUserId } from '@shared/test-mock-account'
const readFile = promisify(fs.readFile)

const filePath = 'package.json'
const fileToken = uuidv4()
it('should upload a new file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

it('should update an existing file', async () => {
  const { status } = await request
    .post(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
    .query({ token: fileToken })
    .attach('file', filePath)
  expect(status).toEqual(200)
})

// TODO should update metadata
// TODO should list metadata
// TODO should reset metadata
// TODO shoud get a list of files. Either a duplicate of metadata list, or create a zip file of the listed objects

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
  expect(token).toEqual(fileToken)
})

it('should delete file', async () => {
  const { status } = await request
    .delete(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(204)
})
