import { NextFunction, Response } from 'express'
import { PathConfig, createContext, getKey, hasPermission } from './utils'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import archiver from 'archiver'
import { s3 } from '@shared/s3'
import { RequestExtended } from '@shared/types'

export const listFile = async (
  req: RequestExtended,
  res: Response,
  _next: NextFunction,
  rules: Partial<PathConfig>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)
  const context = createContext(req)
  if (!hasPermission([rules.list, rules.read], context)) {
    throw Boom.forbidden()
  }
  const params = {
    Bucket: S3_BUCKET as string,
    Prefix: key.slice(0, -1)
  }
  const list = await s3.listObjectsV2(params).promise()

  if (list.Contents) {
    const headObjectsList = (
      await Promise.all(
        list.Contents.map(async ({ Key }) => ({
          key: Key as string,
          head: await s3
            .headObject({
              Bucket: S3_BUCKET as string,
              Key: Key as string
            })
            .promise()
        }))
      )
    ).filter((resource) => hasPermission([rules.list, rules.read], createContext(req, resource)))

    if (isMetadataRequest) {
      return res.status(200).send(
        headObjectsList.map((entry) => {
          return {
            Key: entry.key,
            ...entry.head
          }
        })
      )
    } else {
      const archive = archiver('zip')
      headObjectsList.forEach((entry) => {
        const objectStream = s3
          .getObject({ Bucket: S3_BUCKET as string, Key: entry.key })
          .createReadStream()
        archive.append(objectStream, { name: entry.key })
      })
      res.attachment('list.zip').type('zip')
      archive.on('end', () => res.end())
      archive.pipe(res)
      archive.finalize()
    }
  } else {
    // ? send an error instead?
    return res.status(200).send([])
  }
}
