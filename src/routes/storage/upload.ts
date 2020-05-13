import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  PathConfig,
  createContext,
  generateMetadata,
  getHeadObject,
  getKey,
  hasPermission,
  replaceMetadata
} from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'

export const uploadFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false,
  metadata: object = {}
): Promise<unknown> => {
  console.log({ metadata })

  const key = getKey(req)

  const oldHeadObject = await getHeadObject(req, true)
  const isNew = !oldHeadObject

  if (isNew && !req.files?.file) {
    throw Boom.notFound()
  }

  const resource = req.files?.file as UploadedFile
  const context = createContext(req, resource)

  console.log({ isNew })
  console.log({ context })

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
        token: uuidv4(),
        ...(oldHeadObject?.Metadata || {}),
        ...generateMetadata(metadata, context)
      }
    }
    try {
      await s3.upload(upload_params).promise()
    } catch (err) {
      console.error(err)
      throw Boom.badImplementation('Impossible to create or update the object.')
    }
  } else if (!isNew) {
    // * Update the object metadata. Only possible when the object already exists.
    console.log('file is not new')

    await replaceMetadata(req, true, generateMetadata(metadata, context))
  }
  return res.status(200).send(await getHeadObject(req))
}
