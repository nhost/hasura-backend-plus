import { NextFunction, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { UploadedFile } from 'express-fileupload'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'

export const uploadFile = async (
  req: RequestExtended,
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
        token: oldHeadObject?.Metadata?.token || uuidv4()
      }
    }

    console.log({ upload_params })
    try {
      await s3.upload(upload_params).promise()
    } catch (err) {
      console.error('fail to upload...')
      console.error({ upload_params })

      console.error(err)
      throw Boom.badImplementation('Impossible to create or update the object.')
    }
  } else if (!isNew) {
    console.log('replace old token with new token. And update')

    const updateTokenHeader = req.header('x-revoke-token') === 'true'
    const adminSecretIsOk = req.header('x-admin-secret') === process.env.HASURA_GRAPHQL_ADMIN_SECRET

    if (updateTokenHeader) {
      if (!adminSecretIsOk) {
        throw Boom.unauthorized('incorrect x-admin-secret')
      }

      const key = getKey(req)
      const oldHeadObject = await getHeadObject(req, true)

      const updatedToken = uuidv4()

      console.log({ updatedToken })

      // As S3 objects are immutable, we need to replace the entire object by its copy
      const params = {
        Bucket: S3_BUCKET as string,
        Key: key,
        CopySource: `${S3_BUCKET}/${key}`,
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
        console.log('error updating metadata')
        console.log(err)
        throw Boom.badImplementation('Impossible to update the object metadata.')
      }
    } else {
      throw Boom.notImplemented('Setting metadata is not implemented')
    }
  }
  const headObject = await getHeadObject(req)
  return res.status(200).send({ key, ...headObject })
}
