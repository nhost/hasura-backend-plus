import { Request, Response, NextFunction } from 'express'
import Boom from '@hapi/boom'
import archiver from 'archiver'

import { S3_BUCKET } from '@shared/config'
import { s3 } from '@shared/s3'
import { hasPermission, createContext, getKey, StoragePermissions } from './utils'

export const listFile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  rules: Partial<StoragePermissions>,
  isMetadataRequest = false
): Promise<unknown> => {
  const key = getKey(req)
  try {
    const context = createContext(req)
    if (!hasPermission([rules.list, rules.read], context)) {
      throw Boom.forbidden()
    }
  } catch (err) {
    console.log(
      'List validation did not apply to a directory (without object context). Will anyway run validation for each object in the list.'
    )
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
      return res.status(200).send(headObjectsList.map((entry) => entry.head))
    } else {
      const archive = archiver('zip')
      headObjectsList.forEach((entry) => {
        const objectStream = s3
          .getObject({ Bucket: S3_BUCKET as string, Key: entry.key })
          .createReadStream()
        archive.append(objectStream, { name: entry.head.Metadata?.filename || entry.key })
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
