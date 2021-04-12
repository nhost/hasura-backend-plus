import { NextFunction, Response } from 'express'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET, S3_PRESIGNED_URL_EXPIRES_DEFAULT } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'
import { filePresignedParms } from '@shared/validation'

export const getFilePresignedURL = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>
): Promise<unknown> => {
  const key = getKey(req)
  const headObject = await getHeadObject(req)
  if (!headObject?.Metadata) {
    throw Boom.forbidden()
  }

  const context = createContext(req, headObject)

  if (!hasPermission([rules.get, rules.read], context)) {
    throw Boom.forbidden()
  }

  let expires = S3_PRESIGNED_URL_EXPIRES_DEFAULT;

  if (req.query.expires) {
    const { expires: e } = await filePresignedParms.validateAsync(req.query);
    expires = e;
  }
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key,
    Expires: expires
  }

  try {
    const url = await s3.getSignedUrlPromise('getObject', params)
    return res.status(200).send({ key, url })
  } catch (err) {
    console.error('Fail to generate presigned PUT URL')
    console.error(err)
    throw Boom.badImplementation('Fail to generate presigned PUR URL')
  }
}
