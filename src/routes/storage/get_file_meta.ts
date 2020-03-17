import { Request, Response } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { getAWSOptions } from '../../shared/helpers'
import Boom from '@hapi/boom'
import AWS from 'aws-sdk'

async function get_file(req: Request, res: Response): Promise<unknown> {
  const key = `${req.params[0]}`

  // check storage rules if allowed to get meta info of file
  // TODO:

  // get file info
  const aws_options = getAWSOptions()
  const s3 = new AWS.S3(aws_options)

  const params = {
    Bucket: process.env.S3_BUCKET as string,
    Key: key
  }

  let data
  try {
    data = await s3.headObject(params).promise()
  } catch (e) {
    console.error('error')
    console.error({ e })
    throw Boom.badImplementation()
  }

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

export default asyncWrapper(get_file)
