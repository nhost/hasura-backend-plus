import { NextFunction, Response } from 'express'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'
import { imgTransformParams } from '@shared/validation'

const WEBP = 'image/webp'
const PNG = 'image/png'
const JPEG = 'image/jpeg'

function getHash(items: (string | number | Buffer)[]): string {
  const hash = createHash('sha256')
  for (const item of items) {
    if (typeof item === 'number') hash.update(String(item))
    else {
      hash.update(item)
    }
  }
  // See https://en.wikipedia.org/wiki/Base64#Filenames
  return hash.digest('base64').replace(/\//g, '-')
}

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
    const { width, height, quality, radius, blur } = await imgTransformParams.validateAsync(req.query)
    if (width || height || quality !== 100 || radius || blur) {

      const params = {
        Bucket: S3_BUCKET as string,
        Key: key
      }
      const contentType = headObject?.ContentType

      const object = await s3.getObject(params).promise()

      if (!object.Body) {
        throw Boom.badImplementation('File found without body')
      }

      const transformer = sharp(object.Body as Buffer)
      transformer.rotate() // Rotate the image based on its EXIF data (https://sharp.pixelplumbing.com/api-operation#rotate)
      transformer.resize({ width, height })

      // Add a blur when specified
      if (blur) {
        transformer.blur(blur)
      }

      // Add corners to the image when the radius ('r') is is specified in the query
      if (radius) {
        let { height: imageHeight, width: imageWidth } = await transformer.metadata()

        if (!imageHeight) {
          throw Boom.badImplementation('Unable to determine image height')
        }

        if (!imageWidth) {
          throw Boom.badImplementation('Unable to determine image width')
        }

        if (width && height) {
          imageHeight = height
          imageWidth = width
        } else if (width) {
          imageHeight = Math.round((imageHeight * width) / imageWidth)
          imageWidth = width
        } else if (height) {
          imageWidth = Math.round((imageWidth * height) / imageHeight)
          imageHeight = height
        }

        // Set the radius to 'r' or to 1/2 the height or width
        const maxRadius = Math.min(imageHeight, imageWidth) / 2
        const computedRadius = radius === 'full' ? maxRadius : Math.min(maxRadius, radius)
        const overlay = Buffer.from(
          `<svg><rect x="0" y="0" width="${imageWidth}" height="${imageHeight}" rx="${computedRadius}" ry="${computedRadius}"/></svg>`
        )
        transformer.composite([{ input: overlay, blend: 'dest-in' }])
      }

      if (contentType === WEBP) {
        transformer.webp({ quality })
      } else if (contentType === PNG) {
        transformer.png({ quality })
      } else if (contentType === JPEG) {
        transformer.jpeg({ quality })
      }
      const optimizedBuffer = await transformer.toBuffer()
      const etag = `"${getHash([optimizedBuffer])}"` // The extra quotes are needed to conform to the ETag protocol (https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.11)

      res.set('Content-Type', headObject.ContentType)
      res.set('Content-Disposition', `inline;`)
      res.set('Cache-Control', 'public, max-age=31557600')
      res.set('ETag', etag)
      return res.send(optimizedBuffer)
      // return stream.pipe(transformer).pipe(res)
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
      res.set('Last-Modified', headObject.LastModified?.toUTCString())
      res.set('Content-Disposition', `inline;`)
      res.set('Cache-Control', 'public, max-age=3w1557600')
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
}
