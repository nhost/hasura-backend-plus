import { Request, Response, NextFunction } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'
import { hasPermission, createContext, getKey } from './utils'

export const upsertFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: (string | undefined)[]
): Promise<unknown> => {
  const key = getKey(req)
  if (!req.files?.file) {
    throw Boom.notFound()
  }
  const resource = req.files.file as UploadedFile
  const context = createContext(req, resource)

  if (!hasPermission(rules, context)) {
    throw Boom.forbidden()
  }
  const upload_params = {
    Bucket: S3_BUCKET as string,
    Key: key,
    Body: resource.data,
    ContentType: resource.mimetype,
    Metadata: {
      filename: resource.name
    }
  }

  try {
    await s3.upload(upload_params).promise()
  } catch (err) {
    console.log('upload pb')
    console.log(err)
    throw Boom.badImplementation()
  }

  // return info about the uploaded file
  return res.status(200).send({
    path: key,
    filename: resource.name,
    mimetype: resource.mimetype
  })
}
