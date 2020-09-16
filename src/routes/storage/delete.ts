import { NextFunction, Response } from 'express'
import {
  PathConfig,
  createContext,
  getHeadObject,
  getKey,
  hasPermission,
  replaceMetadata
} from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'

export const deleteFile = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const headObject = await getHeadObject(req)
  const context = createContext(req, headObject)

  if (!hasPermission([rules.delete, rules.write], context)) {
    throw Boom.forbidden()
  }

  if (isMetadataRequest) {
    // * Reset the object's metadata
    await replaceMetadata(req, false)
  } else {
    // * Delete the object, sharp
    const params = {
      Bucket: S3_BUCKET as string,
      Key: getKey(req)
    }
    try {
      await s3.deleteObject(params).promise()
    } catch (err) {
      throw Boom.badImplementation()
    }
  }
  return res.sendStatus(204)
}
