import { NextFunction, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import { STORAGE } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'
import { fileMetadataUpdate } from '@shared/validation'

export const uploadFile = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)

  if (key.endsWith('/')) {
    return res.boom.forbidden(`Can't upload file that ends with /`)
  }

  const oldHeadObject = await getHeadObject(req, true)
  const isNew = !oldHeadObject

  if (isNew && !req.files?.file) {
    return res.boom.notFound()
  }

  const resource = req.files?.file as UploadedFile
  const context = createContext(req, resource)

  if (!isMetadataRequest) {
    if (
      !hasPermission(isNew ? [rules.create, rules.write] : [rules.update, rules.write], context)
    ) {
      return res.boom.forbidden()
    }

    // * Create or update the object
    const upload_params = {
      Bucket: STORAGE.S3_BUCKET,
      Key: key,
      Body: resource.data,
      ContentType: resource.mimetype,
      Metadata: {
        token: oldHeadObject?.Metadata?.token || uuidv4()
      }
    }

    try {
      await s3.upload(upload_params).promise()
    } catch (err) {
      console.error('Fail to upload file')
      console.error({ upload_params })
      console.error(err)
      return res.boom.badImplementation('Impossible to create or update the object.')
    }
  } else if (!isNew) {
    const { action } = await fileMetadataUpdate.validateAsync(req.body)

    if (action === 'revoke-token') {
      if (!hasPermission([], context)) {
        return res.boom.forbidden('incorrect x-access-token')
      }

      const key = getKey(req)
      const oldHeadObject = await getHeadObject(req, true)

      const updatedToken = uuidv4()

      // As S3 objects are immutable, we need to replace the entire object by its copy
      const params = {
        Bucket: STORAGE.S3_BUCKET,
        Key: key,
        CopySource: `${STORAGE.S3_BUCKET}/${key}`,
        ContentType: oldHeadObject?.ContentType,
        Metadata: {
          ...oldHeadObject?.Metadata,
          token: updatedToken
        },
        MetadataDirective: 'REPLACE'
      }

      try {
        await s3.copyObject(params).promise()
      } catch (err) {
        console.error('error updating metadata')
        console.error(err)
        return res.boom.badImplementation('Impossible to update the object metadata.')
      }
    } else {
      return res.boom.notImplemented('Unknown metadata update')
    }
  }

  const headObject = await getHeadObject(req)
  return res.status(200).send({ key, ...headObject })
}
