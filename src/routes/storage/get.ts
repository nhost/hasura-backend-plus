import { NextFunction, Response } from 'express'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'

export const getFile = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
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
  if (isMetadataRequest) {
    return res.status(200).send({ key, ...headObject })
  } else {
    const filesize = headObject.ContentLength as number
    const reqRange = req.headers.range

    let start, end, range, chunksize
    if (reqRange) {
      const parts = reqRange.replace(/bytes=/, '').split('-')
      start = parseInt(parts[0])
      end = parts[1] ? parseInt(parts[1]) : filesize - 1
      range = `bytes=${start}-${end}`
      chunksize = end - start + 1
    }

    const params = {
      Bucket: S3_BUCKET as string,
      Key: key,
      Range: range
    }
    // Split request with stream to be able to abort request on timeout errors
    const request = s3.getObject(params)
    const stream = request.createReadStream().on('error', (err) => {
      console.error(err)
      request.abort()
    })

    // Add the content type to the response (it's not propagated from the S3 SDK)
    res.set('Content-Type', headObject.ContentType)
    res.set('Content-Length', headObject.ContentLength?.toString())
    res.set('Last-Modified', headObject.LastModified?.toString())
    res.set('Content-Disposition', `inline;`)
    res.set('Cache-Control', 'public, max-age=31557600')
    res.set('ETag', headObject.ETag)

    // Set Content Range, Length Accepted Ranges
    if (range) {
      res.set('Content-Length', `${chunksize}`)
      res.set('Content-Range', `bytes ${start}-${end}/${filesize}`)
      res.set('Accept-Ranges', 'bytes')

      // Set 206 Partial Content status if chunked response
      if (chunksize && chunksize < filesize) {
        res.status(206)
      }
    }

    // Pipe the s3 object to the response
    stream.pipe(res)
  }
}
