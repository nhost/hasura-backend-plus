import 'jest-extended'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import { promisify } from 'util'

import { account, request, getUserId } from '@shared/test-mock-account'
const readFile = promisify(fs.readFile)

const fileId = uuidv4()
// let fileToken: string
// let newFileToken: string
const filePath = 'package.json'

it('should upload a file', async () => {
  const { status } = await request
    .post(`/storagev2/user/${getUserId()}/${fileId}`)
    .set('Authorization', `Bearer ${account.token}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

// TODO
// it('should get file metadata', async () => {
//   const {
//     status,
//     body: { filename, token, key }
//   } = await request
//     .get(`/storage/file-meta/${fileId}`)
//     .set('Authorization', `Bearer ${account.token}`)
//   expect(status).toEqual(200)
//   expect(filename).toEqual(filePath)
//   expect(token).toEqual(fileToken)
//   expect(key).toEqual(fileKey)
// })

it('should get file', async () => {
  const { status, text } = await request
    .get(`/storagev2/user/${getUserId()}/${fileId}`)
    .set('Authorization', `Bearer ${account.token}`)
  const fileData = await readFile(filePath, 'utf8')
  expect(status).toEqual(200)
  expect(text).toEqual(fileData)
})

// TODO list
// TODO update

it('should delete file', async () => {
  const { status } = await request
    .delete(`/storagev2/user/${getUserId()}/${fileId}`)
    .set('Authorization', `Bearer ${account.token}`)
  expect(status).toEqual(204)
})
