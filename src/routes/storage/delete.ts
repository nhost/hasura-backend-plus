import { NextFunction, Response } from 'express'
import {
  PathConfig,
  createContext,
  getHeadObject,
  getKey,
  hasPermission,
  replaceMetadata
} from './utils'

import { STORAGE } from '@shared/config'
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
    return res.boom.forbidden()
  }

  if (isMetadataRequest) {
    // * Reset the object's metadata
    await replaceMetadata(req, false)
  } else {
    // * Delete the object, sharp
    const params = {
      Bucket: STORAGE.S3_BUCKET,
      Key: getKey(req)
    }
    try {
      await s3.deleteObject(params).promise()
    } catch (err) {
      return res.boom.badImplementation()
    }
  }
  return res.sendStatus(204)
}
