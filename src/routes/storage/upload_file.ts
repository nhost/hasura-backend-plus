import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { UploadedFile } from 'express-fileupload'
import { asyncWrapper } from '@shared/helpers'
import { s3 } from '@shared/s3'
import { storagePermission } from './rules'
import { v4 as uuidv4 } from 'uuid'
import { verify } from '@shared/jwt'

async function upload_file(req: Request, res: Response): Promise<unknown> {
  if (!req.files?.file) {
    throw Boom.badRequest('No file')
  }

  // get file being uploaded
  const uploaded_file = req.files.file as UploadedFile

  // get path to upload file
  const key = req.headers['x-key'] as string

  // check storageRules if request is ok
  const jwt_token = verify(req.headers.authorization)
  const claims = jwt_token['https://hasura.io/jwt/claims']

  if (!storagePermission(key, 'write', claims)) {
    throw Boom.forbidden()
  }

  // generate access token for file
  const token = uuidv4()

  // upload file
  const upload_params = {
    Bucket: process.env.S3_BUCKET as string,
    Key: key,
    Body: uploaded_file.data,
    ContentType: uploaded_file.mimetype,
    Metadata: {
      token,
      filename: uploaded_file.name
    }
  }

  try {
    await s3.upload(upload_params).promise()
  } catch (err) {
    throw Boom.badImplementation()
  }

  // return info about the uploaded file
  const { name, mimetype } = uploaded_file
  return res.status(200).send({
    key,
    filename: name,
    mimetype,
    token
  })
}

export default asyncWrapper(upload_file)
