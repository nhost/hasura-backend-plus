import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { asyncWrapper } from '@shared/helpers'
import { s3 } from '@shared/s3'

async function getFile(req: Request, res: Response): Promise<void> {
  // ? List permission: allow to list all files, or allow to list files that are allowed to be read?
  const key = req.params[0]
  const token = req.query.token

  // get file info
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key
  }

  let data

  try {
    data = await s3.headObject(params).promise()
  } catch (err) {
    throw Boom.notFound()
  }

  if (!data?.Metadata) {
    throw Boom.forbidden()
  }

  if (data.Metadata.token !== token) {
    throw Boom.forbidden()
  }

  const stream = s3.getObject(params).createReadStream()

  // forward errors
  stream.on('error', (err) => {
    console.error(err)
    throw Boom.badImplementation()
  })

  // Add the content type to the response (it's not propagated from the S3 SDK)
  res.set('Content-Type', data.ContentType)
  res.set('Content-Length', data.ContentLength?.toString())
  res.set('Last-Modified', data.LastModified?.toString())
  res.set('Content-Disposition', `inline;`)
  res.set('Cache-Control', 'public, max-age=31557600')
  res.set('ETag', data.ETag)

  // Pipe the s3 object to the response
  stream.pipe(res)
}

export default asyncWrapper(getFile)
