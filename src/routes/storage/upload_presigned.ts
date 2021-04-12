import { NextFunction, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET, S3_PRESIGNED_URL_EXPIRES_DEFAULT } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'
import { filePresignedParms } from '@shared/validation'

export const uploadFilePresignedURL = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>
): Promise<unknown> => {
  const key = getKey(req)

  if (key.endsWith('/')) {
    throw Boom.forbidden(`Can't upload file that ends with /`)
  }

  const oldHeadObject = await getHeadObject(req, true)
  const isNew = !oldHeadObject

  const context = createContext(req, oldHeadObject)

  if (!hasPermission(isNew ? [rules.create, rules.write] : [rules.update, rules.write], context)) {
    throw Boom.forbidden()
  }

  let expires = S3_PRESIGNED_URL_EXPIRES_DEFAULT

  if (req.body.expires) {
    const { expires: e } = await filePresignedParms.validateAsync(req.body)
    expires = e
  }

  // Generate PreSigned URL
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key,
    Expires: expires,
    Metadata: {
      token: oldHeadObject?.Metadata?.token || uuidv4()
    }
  }

  try {
    const url = await s3.getSignedUrlPromise('putObject', params)
    return res.status(200).send({
      key,
      url
    })
  } catch (err) {
    console.error('Fail to generate presigned PUT URL')
    console.error({ params })
    console.error(err)
    throw Boom.badImplementation('Fail to generate presigned PUT URL')
  }
}
