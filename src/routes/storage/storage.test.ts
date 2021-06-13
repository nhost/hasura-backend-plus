import 'jest-extended'

import { request } from '@test/server'

import fs from 'fs'
import { promisify } from 'util'
import { end } from '@test/supertest-shared-utils'

import { Response } from 'superagent'
import { registerAndLoginAccount } from '@test/utils'

const readFile = promisify(fs.readFile)
const filePath = 'package.json'

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

function token(saver: (t: string) => any) {
  return (res: Response) => {
    saver(res.body.Metadata.token)
  }
}

function tokenIsFileToken(fileToken: string) {
  return (res: Response) => {
    expect(res.body.Metadata.token).toEqual(fileToken)
  }
}

function setFileToken(saver: (f: string) => any) {
  return (res: Response) => {
    saver(res.body.Metadata.token)
  }
}

it('new user should not have any files', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request.get(`/storage/m/user/${id}/`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(bodyArray(0))
      .end(end(done))
  })
})

it('should be able to upload a new file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end(end(done))
  })
})

it('should be able to revoke and generate new token', (done) => {
  let fileToken = ''

  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .expect(setFileToken(f => fileToken = f))
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/m/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })
          .send({ action: 'revoke-token' })
          .expect(200)
          .expect(token(
            t => expect(t).not.toEqual(fileToken)
          ))
          .end(end(done))
      })
  })
})

it('should fail to revoke token on incorrect admin secret', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/m/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .set({ 'x-admin-secret': 'incorrect-admin-secret' })
          .send({ action: 'revoke-token' })
          .expect(403)
          .end(end(done))
      })
  })
})

it('should fail with non existing action with correct admin secret', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/m/user/${id}/${filePath}`)
          .set({ 'x-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET })
          .send({ action: 'non-existing' })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to with incorrect action and incorrect admin secret', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

      request
        .post(`/storage/m/user/${id}/${filePath}`)
        .set({ 'x-admin-secret': 'incorrect-admin-secret' })
        .send({ action: 'non-existing' })
        .expect(400)
        .end(end(done))
    })
  })
})

it('should get the correct amount of files', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .get(`/storage/m/user/${id}/`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .expect(bodyArray(1))
          .end(end(done))
      })
  })
})

it('should fail if trying to upload, without a file attached', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/o/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should update an existing file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/o/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .attach('file', filePath)
          .expect(200)
          .end(end(done))
      })
  })
})

it('should not upload file on missing file name in correct path', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(404)
      .end(end(done))
  })
})

it('should not upload file on incorrect file path', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/123/`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(403)
      .end(end(done))
  })
})

it('should only include one file when updating the same file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .post(`/storage/o/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .attach('file', filePath)
          .expect(200)
          .expect(
            token(
              t => expect(t).toBeString()
            )
          )
          .end((err) => {
            if(err) return done(err)

            request
              .get(`/storage/m/user/${id}/`)
              .set({ Authorization: `Bearer ${jwtToken}` })
              .expect(200)
              .expect(bodyArray(1))
              .end(end(done))
          })
      })
  })
})

it('should not update an hypothetical file of another hypothetical user', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/user/another-user/another-file`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(403)
      .end(end(done))
  })
})

it('should get file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        readFile(filePath, 'utf8').then(fileData => {
          request
            .get(`/storage/o/user/${id}/${filePath}`)
            .set({ Authorization: `Bearer ${jwtToken}` })
            .expect(200)
            .expect(textIsFileData(fileData))
            .end(end(done))
        })
      })
  })
})

describe('Tests as an unauthenticated user', () => {
  it('should get file from the token stored in the file metadata while unauthenticated', (done) => {
    let fileToken = ''

    registerAndLoginAccount(request).then(({ id, jwtToken }) => {
      request
        .post(`/storage/o/user/${id}/${filePath}`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .attach('file', filePath)
        .expect(200)
        .expect(
          token(
            t => expect(t).toBeString()
          )
        )
        .expect(setFileToken(f => fileToken = f))
        .end((err) => {
          if(err) return done(err)

          request
            .post(`/auth/logout`)
            .end((err) => {
              if(err) return done(err)

              readFile(filePath, 'utf8').then(fileData => {
                request
                  .get(`/storage/o/user/${id}/${filePath}`)
                  .query({ token: fileToken })
                  .expect(200)
                  .expect(textIsFileData(fileData))
                  .end(end(done))
              });
            })
        })
    })
  })

  it('should not get file from incorrect token while unauthenticated', (done) => {
    registerAndLoginAccount(request).then(({ id, jwtToken }) => {
      request
        .post(`/storage/o/user/${id}/${filePath}`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .attach('file', filePath)
        .expect(200)
        .end((err) => {
          if(err) return done(err)

          request
            .post(`/auth/logout`)
            .end((err) => {
              if(err) return done(err)

              readFile(filePath, 'utf8').then(() => {
                request
                  .get(`/storage/o/user/${id}/${filePath}`)
                  .query({ token: 'incorrect' })
                  .expect(403)
                  .end(end(done))
              });
            })
        })
    })
  })

  it('should not get file without authentication nor token', (done) => {
    registerAndLoginAccount(request).then(({ id, jwtToken }) => {
      request
        .post(`/storage/o/user/${id}/${filePath}`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .attach('file', filePath)
        .expect(200)
        .end((err) => {
          if(err) return done(err)

          request
            .post(`/auth/logout`)
            .end((err) => {
              if(err) return done(err)

              request
                .get(`/storage/o/user/${id}/${filePath}`)
                .expect(403)
                .end(end(done))
            })
        })
    })
  })
  // TODO attempt to get the file from another authenticated user
})

// it(`should update an existing file's metadata`, (done) => {
//   const { status } = await request
//     .post(`/storage/m/user/${id}/${filePath}`)
//     .query({ description: newDescription })
//   expect(status).toEqual(200)
// })

it('should get file metadata', (done) => {
  let fileToken = ''

  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .expect(
        token(
          t => expect(t).toBeString()
        )
      )
      .expect(setFileToken(f => fileToken = f))
      .end((err) => {
        if(err) return done(err)

        request
          .get(`/storage/m/user/${id}/${filePath}`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .expect(tokenIsFileToken(fileToken))
          .end(end(done))
      })
  })
})

it('should get the headers of all the user files', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', filePath)
      .expect(200)
      .end((err) => {
        if(err) return done(err)

        request
          .get(`/storage/m/user/${id}/`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .expect(bodyArray(1))
          .end(end(done))
      })
  })
})

it('should get a zip that contains all user files', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .get(`/storage/o/user/${id}/`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(text())
      .end(end(done))
  })
  // TODO unzip and compare the file(s)
})

it('should delete file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
        .post(`/storage/o/user/${id}/${filePath}`)
        .set({ Authorization: `Bearer ${jwtToken}` })
        .attach('file', filePath)
        .expect(200)
        .end((err) => {
          if(err) return done(err)

          request
            .delete(`/storage/o/user/${id}/${filePath}`)
            .set({ Authorization: `Bearer ${jwtToken}` })
            .expect(204)
            .end(end(done))
        })
  })
})

it('should not be able to get deleted file', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .get(`/storage/o/user/${id}/${filePath}`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(404)
      .end(end(done))
  })
})

it('should get the headers of no files', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .get(`/storage/m/user/${id}/`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .expect(200)
      .expect(bodyArray(0))
      .end(end(done))
  })
})

it('should upload a new imae', (done) => {
  registerAndLoginAccount(request).then(({ id, jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(end(done))
  })
})

it('should get image', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .expect(200)
          .end(end(done))
      })
  })
})

it('should get image with width and height parameter', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .query({ w: '100', h: '200' })
          .expect(200)
          .end(end(done))
      })
  })
})

it('should get image with width, height and quality parameter', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .set({ Authorization: `Bearer ${jwtToken}` })
          .query({ w: '100', h: '200', q: '50' })
          .expect(200)
          .end(end(done))
      })
  })
})

it('should fail to get image with width parameter of -1', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ w: '-1', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to get image with width parameter of 10000', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ w: '10000', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to get image with height parameter of -1', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ h: '-1', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to get image with height parameter of 10000', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ h: '10000', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to get image with quality parameter of -1', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ q: '-1', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})

it('should fail to get image with quality parameter of 101', (done) => {
  registerAndLoginAccount(request).then(({ jwtToken }) => {
    request
      .post(`/storage/o/public/example.jpg`)
      .set({ Authorization: `Bearer ${jwtToken}` })
      .attach('file', 'test-mocks/example.jpg')
      .expect(200)
      .end(err => {
        if(err) return done(err)

        request
          .get(`/storage/o/public/example.jpg`)
          .query({ q: '101', jwtToken })
          .expect(400)
          .end(end(done))
      })
  })
})
