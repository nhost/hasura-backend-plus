import { Request, Response, NextFunction } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { getKey, createContext, hasPermission, getResource, StoragePermissions } from './utils'

export const deleteFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<StoragePermissions>,
  isMetadataRequest = false
): Promise<unknown> => {
  // get file info
  const params = {
    Bucket: S3_BUCKET as string,
    Key: getKey(req)
  }

  const resource = await getResource(req)
  const context = createContext(req, resource)

  if (!hasPermission([rules.delete, rules.write], context)) {
    throw Boom.forbidden()
  }

  if (isMetadataRequest) {
    throw Boom.notImplemented('Not yet implemented') // TODO
  } else {
    try {
      await s3.deleteObject(params).promise()
    } catch (err) {
      throw Boom.badImplementation()
    }

    return res.sendStatus(204)
  }
}
