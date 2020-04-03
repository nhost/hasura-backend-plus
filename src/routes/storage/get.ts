import { Request, Response, NextFunction } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { hasPermission, createContext, getKey, getResource, StoragePermissions } from './utils'

export const getFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<StoragePermissions>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)
  // get file info
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key
  }
  const resource = await getResource(req)

  if (!resource?.Metadata) {
    throw Boom.forbidden()
  }

  const context = createContext(req, resource)

  if (!hasPermission([rules.get, rules.read], context)) {
    throw Boom.forbidden()
  }

  if (isMetadataRequest) {
    return res.status(200).send(resource)
  } else {
    const stream = s3.getObject(params).createReadStream()
    // forward errors
    stream.on('error', (err) => {
      console.error(err)
      throw Boom.badImplementation()
    })

    // Add the content type to the response (it's not propagated from the S3 SDK)
    res.set('Content-Type', resource.ContentType)
    res.set('Content-Length', resource.ContentLength?.toString())
    res.set('Last-Modified', resource.LastModified?.toString())
    res.set('Content-Disposition', `inline;`)
    res.set('Cache-Control', 'public, max-age=31557600')
    res.set('ETag', resource.ETag)

    // Pipe the s3 object to the response
    stream.pipe(res)
  }
}
