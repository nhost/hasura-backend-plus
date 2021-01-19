import { NextFunction, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'

export const revokeAccessToken = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)
  const context = createContext(req)

  if (!hasPermission([rules.write, rules.update], context)) {
    throw Boom.forbidden()
  }

  const newToken = uuidv4()

  let params = {
    Bucket: S3_BUCKET as string,
    Key: key,
    CopySource: key,
    Metadata: {
      token: newToken
    },
    MetadataDirective: 'REPLACE'
  }

  try {
    await s3.copyObject(params).promise()
  } catch (err) {
    console.error('fail to set new access token')
    console.error(err)
    throw Boom.badImplementation('Impossible to create or update the object.')
  }

  return res.status(200).send({ token: newToken })
}
