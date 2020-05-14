import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'

export const uploadFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)

  const oldHeadObject = await getHeadObject(req, true)
  const isNew = !oldHeadObject

  if (isNew && !req.files?.file) {
    throw Boom.notFound()
  }

  const resource = req.files?.file as UploadedFile
  const context = createContext(req, resource)

  if (!hasPermission(isNew ? [rules.create, rules.write] : [rules.update, rules.write], context)) {
    throw Boom.forbidden()
  }

  if (!isMetadataRequest) {
    // * Create or update the object
    const upload_params = {
      Bucket: S3_BUCKET as string,
      Key: key,
      Body: resource.data,
      ContentType: resource.mimetype,
      Metadata: {
        filename: resource.name,
        token: oldHeadObject?.Metadata?.token || uuidv4()
      }
    }
    try {
      await s3.upload(upload_params).promise()
    } catch (err) {
      console.error(err)
      throw Boom.badImplementation('Impossible to create or update the object.')
    }
  } else if (!isNew) {
    throw Boom.notImplemented('Setting metadata is not implemented')
    // await replaceMetadata(req, true, generateMetadata(metadata, context))
  }
  return res.status(200).send(await getHeadObject(req))
}
