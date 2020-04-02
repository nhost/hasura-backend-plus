import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { S3_BUCKET } from '@shared/config'
import { asyncWrapper } from '@shared/helpers'
import { s3 } from '@shared/s3'
import { storagePermission } from '@custom/storage-rules'
import { verify } from '@shared/jwt'

async function getFileMeta(req: Request, res: Response): Promise<unknown> {
  const key = req.params[0]

  // check storage rules if allowed to get meta info of file
  const jwt_token = verify(req.headers.authorization)
  const claims = jwt_token['https://hasura.io/jwt/claims']

  if (!storagePermission(key, 'read', claims)) {
    throw Boom.forbidden()
  }

  // get file info
  const params = {
    Bucket: S3_BUCKET as string,
    Key: key
  }

  let data
  try {
    data = await s3.headObject(params).promise()
  } catch (err) {
    throw Boom.badImplementation()
  }

  // TODO: Generate data.Metadata.token if token does not exist
  if (!data?.Metadata) {
    throw Boom.forbidden()
  }

  // return info about the uploaded file
  const { filename, token } = data.Metadata
  return res.status(200).send({
    key,
    filename,
    token,
    mimetype: data.ContentType
  })
}

export default asyncWrapper(getFileMeta)
