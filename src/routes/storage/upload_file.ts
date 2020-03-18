import { Request, Response } from 'express'
import { asyncWrapper } from '@shared/helpers'
import { getAWSOptions, verifyJwt } from '@shared/helpers'
import { storagePermission } from './rules'
import Boom from '@hapi/boom'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'

interface UploadedFile {
  /** file name */
  name: string
  /** A function to move the file elsewhere on your server */
  mv(path: string, callback: (err: any) => void): void
  mv(path: string): Promise<void>
  /** Encoding type of the file */
  encoding: string
  /** The mimetype of your file */
  mimetype: string
  /** A buffer representation of your file, returns empty buffer in case useTempFiles option was set to true. */
  data: Buffer
  /** A path to the temporary file in case useTempFiles option was set to true. */
  tempFilePath: string
  /** A boolean that represents if the file is over the size limit */
  truncated: boolean
  /** Uploaded size in bytes */
  size: number
  /** MD5 checksum of the uploaded file */
  md5: string
}

async function upload_file(req: Request, res: Response): Promise<unknown> {
  if (!req.files?.file) {
    throw Boom.badRequest('No file')
  }

  // get file being uploaded
  const uploaded_file = req.files.file as UploadedFile

  // get path to upload file
  const key = req.headers['x-key'] as string

  // check storageRules if request is ok
  const jwt_token = verifyJwt(req.headers.authorization)
  const claims = jwt_token['https://hasura.io/jwt/claims']

  if (!storagePermission(key, 'write', claims)) {
    throw Boom.forbidden()
  }

  // generate access token for file
  const token = uuidv4()

  // upload file
  const aws_options = getAWSOptions()
  const s3 = new AWS.S3(aws_options)

  const upload_params = {
    Bucket: process.env.S3_BUCKET as string,
    Key: key,
    Body: uploaded_file.data,
    ContentType: uploaded_file.mimetype,
    Metadata: {
      token,
      filename: uploaded_file.name
    }
  }

  try {
    await s3.upload(upload_params).promise()
  } catch (e) {
    console.log('error')
    console.log({ e })
    throw Boom.badImplementation()
  }

  // return info about the uploaded file
  const { name, mimetype } = uploaded_file
  return res.status(200).send({
    key,
    filename: name,
    mimetype,
    token
  })
}

export default asyncWrapper(upload_file)
