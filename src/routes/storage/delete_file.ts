import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { s3 } from '@shared/s3'
import { storagePermission } from './rules'
import { verify } from '@shared/jwt'

async function delete_file(req: Request, res: Response): Promise<unknown> {
  const key = `${req.params[0]}`

  // check storage rules if allowed to get meta info of file
  const jwt_token = verify(req.headers.authorization)
  const claims = jwt_token['https://hasura.io/jwt/claims']

  if (!storagePermission(key, 'write', claims)) {
    throw Boom.forbidden()
  }

  // get file info
  const params = {
    Bucket: process.env.S3_BUCKET as string,
    Key: key
  }

  try {
    await s3.deleteObject(params).promise()
  } catch (e) {
    console.error('error')
    console.error({ e })
    throw Boom.badImplementation()
  }

  return res.sendStatus(204)
}

export default asyncWrapper(delete_file)
