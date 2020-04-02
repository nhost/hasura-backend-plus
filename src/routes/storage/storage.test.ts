import 'jest-extended'
import fs from 'fs'
import { promisify } from 'util'

import { account, request, getUserId } from '@shared/test-mock-account'
const readFile = promisify(fs.readFile)

const filePath = 'package.json'

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
    .attach('file', filePath)
  expect(status).toEqual(200)
})

// TODO define a token in metadata
// TODO should read from a token
// TODO metadata
/// it('should get file metadata', async () => {
//   const {
//     status,
//     body: { filename, token, key }
//   } = await request
//     .get(`/storage/file-meta/${filePath}`)
//     .set('Authorization', `Bearer ${account.token}`)
//   expect(status).toEqual(200)
//   expect(filename).toEqual(filePath)
//   expect(token).toEqual(fileToken)
//   expect(key).toEqual(fileKey)
// })

it('should get file', async () => {
  const { status, text } = await request
    .get(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  const fileData = await readFile(filePath, 'utf8')
  expect(status).toEqual(200)
  expect(text).toEqual(fileData)
})

// TODO list

it('should delete file', async () => {
  const { status } = await request
    .delete(`/storage/user/${getUserId()}/${filePath}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(204)
})
