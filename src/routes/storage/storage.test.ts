import 'jest-extended'

import { account, getUserId, request } from '@test/test-mock-account'

import fs from 'fs'
import { promisify } from 'util'
import { end } from '@test/supertest-shared-utils'

import { Response } from 'superagent'

const readFile = promisify(fs.readFile)
const filePath = 'package.json'
let fileToken: string

function bodyArray(length: number) {
  return (res: Response) => {
    expect(res.body).toBeArrayOfSize(length)
  }
}

function text() {
  return (res: Response) => {
    expect(res.text).toBeTruthy()
  }
}

function textIsFileData(fileData: string) {
  return (res: Response) => {
    expect(res.text).toEqual(fileData)
  }
}

function token(fn: (token: string) => any) {
  return (res: Response) => {
    fn(res.body.Metadata.token)
  }
}

function tokenisFileToken() {
  return (res: Response) => {
    expect(res.body.Metadata.token).toEqual(fileToken)
  }
}

function setFileToken() {
  return (res: Response) => {
    fileToken = res.body.Metadata.token
  }
}

it('should not have any files', (done) => {
  request.get(`/storage/m/user/${getUserId()}/`)
    .expect(200)
    .expect(bodyArray(0))
    .end(end(done))
})

it('should upload a new file', (done) => {
  request
    .post(`/storage/o/user/${getUserId()}/${filePath}`)
    .attach('file', filePath)
    .expect(200)
    .expect(
      token(
        t => expect(t).toBeString()
      )
    )
    .expect(setFileToken())
    .end(end(done))
})

it('should revoke and generate new token', (done) => {
  request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'revoke-token' })
    .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })
    .expect(200)
    .expect(token(
      t => expect(t).not.toEqual(fileToken)
    ))
    .expect(setFileToken())
    .end(end(done))
})

it('should fail to revoke token on incorrect admin secret', (done) => {
  request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'revoke-token' })
    .set({ 'x-admin-secret': 'incorrect-admin-secret' })
    .expect(403)
    .end(end(done))
})

it('should fail with non existing action with correct admin secret', (done) => {
  request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'non-existing' })
    .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })
    .expect(400)
    .end(end(done))
})

it('should fail to with incorrect action and incorrect admin secret', (done) => {
  request
    .post(`/storage/m/user/${getUserId()}/${filePath}`)
    .send({ action: 'non-existing' })
    .set({ 'x-admin-secret': 'incorrect-admin-secret' })
    .expect(400)
    .end(end(done))
})

it('should include one file', (done) => {
  request
    .get(`/storage/m/user/${getUserId()}/`)
    .expect(200)
    .expect(bodyArray(1))
    .end(end(done))
})

it('should fail if trying to upload, without a file attached', (done) => {
  request
    .post(`/storage/o/user/${getUserId()}/${filePath}`)
    .expect(400)
    .end(end(done))
})

it('should update an existing file', (done) => {
  request
    .post(`/storage/o/user/${getUserId()}/${filePath}`)
    .attach('file', filePath)
    .expect(200)
    .end(end(done))
})

it('should not upload file on missing file name in correct path', (done) => {
  request
    .post(`/storage/o/user/${getUserId()}/`)
    .attach('file', filePath)
    .expect(404)
    .end(end(done))
})

it('should not upload file on incorrect file path', (done) => {
  request
    .post(`/storage/o/user/${getUserId()}/123/`)
    .attach('file', filePath)
    .expect(403)
    .end(end(done))
})

it('should still only include one file', (done) => {
  request
    .get(`/storage/m/user/${getUserId()}/`)
    .expect(200)
    .expect(bodyArray(1))
    .end(end(done))
})

it('should not update an hypothetical file of another hypothetical user', (done) => {
  request
    .post(`/storage/o/user/another-user/another-file`)
    .attach('file', filePath)
    .expect(403)
    .end(end(done))
})

it('should get file', (done) => {
  readFile(filePath, 'utf8').then(fileData => {
    request
      .get(`/storage/o/user/${getUserId()}/${filePath}`)
      .expect(200)
      .expect(textIsFileData(fileData))
      .end(end(done))
  })
})

describe('Tests as an unauthenticated user', () => {
  beforeAll((done) => {
    request
      .post(`/auth/logout`)
      .end(end(done))
  })

  afterAll((done) => {
    request
      .post('/auth/login')
      .send({ email: account.email, password: account.password, cookie: true })
      .end(end(done))
  })

  it('should get file from the token stored in the file metadata while unauthenticated', (done) => {
    readFile(filePath, 'utf8').then(fileData => {
      request
        .get(`/storage/o/user/${getUserId()}/${filePath}`)
        .query({ token: fileToken })
        .expect(200)
        .expect(textIsFileData(fileData))
        .end(end(done))
    });
  })

  it('should not get file from incorrect token while unauthenticated', (done) => {
    request
      .get(`/storage/o/user/${getUserId()}/${filePath}`)
      .query({ token: 'incorrect' })
      .expect(403)
      .end(end(done))
  })

  it('should not get file without authentication nor token', (done) => {
    request
      .get(`/storage/o/user/${getUserId()}/${filePath}`)
      .expect(403)
      .end(end(done))
  })
  // TODO attempt to get the file from another authenticated user
})

// it(`should update an existing file's metadata`, (done) => {
//   const { status } = await request
//     .post(`/storage/m/user/${getUserId()}/${filePath}`)
//     .query({ description: newDescription })
//   expect(status).toEqual(200)
// })

it('should get file metadata', (done) => {
  request
    .get(`/storage/m/user/${getUserId()}/${filePath}`)
    .expect(200)
    .expect(tokenisFileToken())
    .end(end(done))
})

it('should get the headers of all the user files', (done) => {
  request
    .get(`/storage/m/user/${getUserId()}/`)
    .expect(200)
    .expect(bodyArray(1))
    .end(end(done))
})

it('should get a zip that contains all user files', (done) => {
  request
    .get(`/storage/o/user/${getUserId()}/`)
    .expect(200)
    .expect(text())
    .end(end(done))
  // TODO unzip and compare the file(s)
})

it('should delete file', (done) => {
  request
    .delete(`/storage/o/user/${getUserId()}/${filePath}`)
    .expect(204)
    .end(end(done))
})

it('should not be able to get deleted file', (done) => {
  request
    .get(`/storage/o/user/${getUserId()}/${filePath}`)
    .expect(404)
    .end(end(done))
})

it('should get the headers of no files', (done) => {
  request
    .get(`/storage/m/user/${getUserId()}/`)
    .expect(200)
    .expect(bodyArray(0))
    .end(end(done))
})

it('should upload a new imae', (done) => {
  request
    .post(`/storage/o/public/example.jpg`)
    .attach('file', 'test-mocks/example.jpg')
    .expect(200)
    .end(end(done))
})

it('should get image', (done) => {
  request
    .get(`/storage/o/public/example.jpg`)
    .expect(200)
    .end(end(done))
})

it('should get image with width and height parameter', (done) => {
  request
    .get(`/storage/o/public/example.jpg?w=100&h=200`)
    .expect(200)
    .end(end(done))
})

it('should get image with width, height and quality parameter', (done) => {
  request
    .get(`/storage/o/public/example.jpg?w=100&h=200&q=50`)
    .expect(200)
    .end(end(done))
})

it('should fail to get image with width parameter of -1', (done) => {
  request
    .get(`/storage/o/public/example.jpg?w=-1`)
    .expect(400)
    .end(end(done))
})

it('should fail to get image with width parameter of 10000', (done) => {
  request
    .get(`/storage/o/public/example.jpg?w=10000`)
    .expect(400)
    .end(end(done))
})

it('should fail to get image with height parameter of -1', (done) => {
  request
    .get(`/storage/o/public/example.jpg?h=-1`)
    .expect(400)
    .end(end(done))
})

it('should fail to get image with height parameter of 10000', (done) => {
  request
    .get(`/storage/o/public/example.jpg?h=10000`)
    .expect(400)
    .end(end(done))
})

it('should fail to get image with quality parameter of -1', (done) => {
  request
    .get(`/storage/o/public/example.jpg?q=-1`)
    .expect(400)
    .end(end(done))
})

it('should fail to get image with quality parameter of 101', (done) => {
  request
    .get(`/storage/o/public/example.jpg?q=101`)
    .expect(400)
    .end(end(done))
})
