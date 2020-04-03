import { Request, Response, NextFunction } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'
import {
  hasPermission,
  createContext,
  getKey,
  generateMetadata,
  StoragePermissions,
  getResourceHeaders
} from './utils'

export const uploadFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<StoragePermissions>,
  isMetadataRequest = false,
  metadata: object = {}
): Promise<unknown> => {
  const key = getKey(req)

  const oldResourceHeaders = await getResourceHeaders(req, true)
  const isNew = !oldResourceHeaders

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
        ...(oldResourceHeaders?.Metadata || {}),
        ...generateMetadata(metadata, context)
      }
    }
    try {
      await s3.upload(upload_params).promise()
    } catch (err) {
      console.log('upload pb')
      console.log(err)
      throw Boom.badImplementation('Impossible to create or update the object.')
    }
  } else if (!isNew) {
    // * Update the object metadata. Only possible when the object already exists.
    // As S3 objects are immutable, we need to replace the entire object by its copy
    const params = {
      Bucket: S3_BUCKET as string,
      Key: key,
      CopySource: `${S3_BUCKET}/${key}`,
      ContentType: oldResourceHeaders?.ContentType,
      Metadata: {
        ...(oldResourceHeaders?.Metadata || {}),
        ...generateMetadata(metadata, context)
      },
      MetadataDirective: 'REPLACE'
    }
    try {
      await s3.copyObject(params).promise()
    } catch (err) {
      console.log(err)
      throw Boom.badImplementation('Impossible to update the object metadata.')
    }
  }
  return res.status(200).send(await getResourceHeaders(req))
}
