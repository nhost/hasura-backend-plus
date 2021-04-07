import { NextFunction, Response } from 'express'
import { PathConfig, createContext, getHeadObject, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'
import { imgTransformParams } from '@shared/validation'

const AVIF = 'image/avif'
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
  } else if (!req?.headers) {
    throw Boom.badImplementation('No headers were set')
  } else if (!req?.headers.accept) {
    throw Boom.badImplementation('No accept headers were set')
  }
  const context = createContext(req, headObject)

  if (!hasPermission([rules.get, rules.read], context)) {
    throw Boom.forbidden()
  }
  if (isMetadataRequest) {
    return res.status(200).send({ key, ...headObject })
  } else {
    const { width, height, quality, format, fit, crop, radius, blur } = await imgTransformParams.validateAsync(req.query)
    if (width || height || quality !== 100 || format || fit || crop || radius || blur) {

      const params = {
        Bucket: S3_BUCKET as string,
        Key: key
      }

      const object = await s3.getObject(params).promise()

      if (!object.Body) {
        throw Boom.badImplementation('File found without body')
      }

      // Find and set the contentType
      let contentType
      if (format === 'auto' && req.headers.accept.split(',').some(header => header === AVIF)) {
        contentType = AVIF
      } else if (format === 'auto' && req.headers.accept.split(',').some(header => header === WEBP)) {
        contentType = WEBP
      } else if (format && format !== 'auto') {
        contentType = `image/${format}`
      } else {
        contentType = headObject.ContentType
      }

      if (!contentType) {
        throw Boom.badImplementation('Unable to determine ContentType')
      }

      const transformer = sharp(object.Body as Buffer)

      const { width: originalWidth, height: originalHeight } = await transformer.metadata()

      if (!originalHeight) {
        throw Boom.badImplementation('Unable to determine image height')
      }

      if (!originalWidth) {
        throw Boom.badImplementation('Unable to determine image width')
      }

      // Use the newWidth and newHeight variables to not serve an image that is larger than the original
      const originalAspectRatio = originalWidth / originalHeight
      let newWidth, newHeight
      if (width && height) {
        const newAspectRatio = width / height
        newWidth = Math.min(width, originalWidth, Math.round(originalHeight * newAspectRatio))
        newHeight = Math.min(height, originalHeight, Math.round(originalWidth / newAspectRatio))
      } else if (width) {
        newWidth = Math.min(width, originalWidth)
        newHeight = Math.min(Math.round(width / originalAspectRatio), originalHeight)
      } else if (height) {
        newWidth = Math.min(Math.round(height * originalAspectRatio), originalWidth)
        newHeight = Math.min(height, originalHeight)
      } else {
        newWidth = originalWidth
        newHeight = originalHeight
      }

      transformer.rotate() // Rotate the image based on its EXIF data (https://sharp.pixelplumbing.com/api-operation#rotate)
      transformer.resize({
        width: newWidth,
        height: newHeight,
        fit,
        position: ['entropy', 'attention'].includes(crop) ? sharp.strategy[crop] : crop
      })

      // Add a blur when specified
      if (blur) {
        transformer.blur(blur)
      }

      // Add corners to the image when the radius ('r') is is specified in the query
      if (radius) {
        // Set the radius to 'r' or to 1/2 the height or width
        const maxRadius = Math.min(newWidth, newHeight) / 2
        const computedRadius = radius === 'full' ? maxRadius : Math.min(maxRadius, radius)
        const overlay = Buffer.from(
          `<svg><rect x="0" y="0" width="${newWidth}" height="${newHeight}" rx="${computedRadius}" ry="${computedRadius}"/></svg>`
        )
        transformer.composite([{ input: overlay, blend: 'dest-in' }])
      }

      // Set the quality of the image
      if (contentType === AVIF) {
        transformer.avif({ quality })
      } else if (contentType === WEBP) {
        transformer.webp({ quality })
      } else if (contentType === PNG) {
        transformer.png({ quality })
      } else if (contentType === JPEG) {
        transformer.jpeg({ quality })
      }

      // Transform to the new format, if explicitly set
      if (contentType !== headObject.ContentType) {
        const newFormat = contentType.split('image/')[1]

        if (newFormat) {
          transformer.toFormat(newFormat)
        }
      }

      const optimizedBuffer = await transformer.toBuffer()
      const etag = `"${getHash([optimizedBuffer])}"` // The extra quotes are needed to conform to the ETag protocol (https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.11)

      res.set('Content-Type', contentType)
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
