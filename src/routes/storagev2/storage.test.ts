import 'jest-extended'
// import { v4 as uuidv4 } from 'uuid'
// import fs from 'fs'
// import { promisify } from 'util'
// import { HASURA_GRAPHQL_ADMIN_SECRET } from '@shared/config'

import { account, request } from '@shared/test-mock-account'
import { JWT } from 'jose'
import { Token } from '@shared/jwt'
// const readFile = promisify(fs.readFile)

// const fileKey = uuidv4()
// let fileToken: string
// let newFileToken: string
const filePath = 'package.json'

it('should upload a file', async () => {
  const decodedJwt = JWT.decode(account.token as string) as Token
  const userId = decodedJwt['https://hasura.io/jwt/claims']['x-hasura-user-id']
  const { status } = await request
    .post(`/storagev2/user/${userId}/test`)
    .set('Authorization', `Bearer ${account.token}`)
    .attach('file', filePath)
  expect(status).toEqual(200)
})

// it('should get file metadata', async () => {
//   const {
//     status,
//     body: { filename, token, key }
//   } = await request
//     .get(`/storage/file-meta/${fileKey}`)
//     .set('Authorization', `Bearer ${account.token}`)
//   expect(status).toEqual(200)
//   expect(filename).toEqual(filePath)
//   expect(token).toEqual(fileToken)
//   expect(key).toEqual(fileKey)
// })

// it('should get file', async () => {
//   const { status, text } = await request
//     .get(`/storage/file/${fileKey}`)
//     .set('Authorization', `Bearer ${account.token}`)
//     .query({ token: fileToken })
//   const fileData = await readFile(filePath, 'utf8')
//   expect(status).toEqual(200)
//   expect(text).toEqual(fileData)
// })

// it('should revoke the file', async () => {
//   const { status: revokeStatus, body } = await request
//     .post(`/storage/revoke/${fileKey}`)
//     .set('x-hasura-admin-secret', HASURA_GRAPHQL_ADMIN_SECRET as string)
//   newFileToken = body.token
//   expect(revokeStatus).toEqual(200)
//   const { status: getFileStatus } = await request
//     .get(`/storage/file/${fileKey}`)
//     .set('Authorization', `Bearer ${account.token}`)
//     .query({ token: fileToken })
//   expect(getFileStatus).toEqual(403)
// })

// it('should delete file', async () => {
//   const { status } = await request
//     .delete(`/storage/file/${fileKey}`)
//     .set('Authorization', `Bearer ${account.token}`)
//     .query({ token: newFileToken })
//   expect(status).toEqual(204)
// })
