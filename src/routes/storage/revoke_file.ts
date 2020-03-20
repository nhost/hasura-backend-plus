import { Request, Response } from 'express'

import Boom from '@hapi/boom'
import { asyncWrapper } from '@shared/helpers'
import { s3 } from '@shared/s3'
import { v4 as uuidv4 } from 'uuid'
import { S3_BUCKET, HASURA_GRAPHQL_ADMIN_SECRET } from '@shared/config'

async function revokeFile(req: Request, res: Response): Promise<unknown> {
  const key = req.params[0]

  if (req.headers['x-hasura-admin-secret'] !== HASURA_GRAPHQL_ADMIN_SECRET) {
    throw Boom.forbidden()
  }

  // get file info
  const current_params = {
    Bucket: S3_BUCKET as string,
    Key: key
  }

  // get current file
  let current_data
  try {
    current_data = await s3.headObject(current_params).promise()
  } catch (err) {
    throw Boom.badImplementation()
  }

  // generate new tokens and other parameter values
  const new_token = uuidv4()
  const bucket_decoded = decodeURIComponent(S3_BUCKET as string)
  const key_decoded = decodeURIComponent(key)

  // copy the object with the updated token
  const new_params = {
    Bucket: S3_BUCKET as string,
    Key: key_decoded,
    CopySource: encodeURIComponent(`${bucket_decoded}/${key_decoded}`),
    ContentType: current_data.ContentType,
    Metadata: {
      token: new_token
    },
    MetadataDirective: 'REPLACE'
  }

  // update the current file with the new token
  try {
    await s3.copyObject(new_params).promise()
  } catch (e) {
    throw Boom.badImplementation('Could not generate token')
  }

  // return info about the uploaded file
  return res.status(200).send({
    key,
    token: new_token,
    mimetype: current_data.ContentType
  })
}

export default asyncWrapper(revokeFile)
